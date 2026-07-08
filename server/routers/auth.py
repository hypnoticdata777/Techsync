"""Auth endpoints: login, refresh, password reset, current user (RF-01, RF-03)."""

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user
from logger import logger
from models.user import (
    ForgotPasswordRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
    User,
    UserLogin,
)
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
def login(credentials: UserLogin):
    user_row = auth_service.authenticate(credentials.email, credentials.password)
    if not user_row:
        logger.warning(
            "auth.login_failed", extra={"event": "login_failed", "email": credentials.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )
    return auth_service.issue_tokens(user_row)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest):
    tokens = auth_service.refresh_access_token(payload.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token"
        )
    return tokens


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest):
    raw_token = auth_service.request_password_reset(payload.email)
    if raw_token:
        # In production this would be emailed, not logged. Logging here keeps the
        # POC demoable without an email provider configured.
        logger.info(
            "auth.password_reset_requested",
            extra={"event": "password_reset_requested", "email": payload.email, "reset_token": raw_token},
        )
    # Always return a generic success response to avoid leaking which emails are registered.
    return {"detail": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    success = auth_service.reset_password(payload.token, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token"
        )
    return {"detail": "Password updated successfully"}


@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
