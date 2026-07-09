"""Auth endpoints: login, refresh, password reset, current user (RF-01, RF-03)."""

from fastapi import APIRouter, Depends, HTTPException, status

from core.rate_limit import LOGIN_RATE_LIMIT, PASSWORD_RESET_RATE_LIMIT, rate_limit_dependency
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
from services import auth_service, email_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenPair,
    dependencies=[Depends(rate_limit_dependency(LOGIN_RATE_LIMIT))],
)
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


@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(rate_limit_dependency(PASSWORD_RESET_RATE_LIMIT))],
)
def forgot_password(payload: ForgotPasswordRequest):
    raw_token = auth_service.request_password_reset(payload.email)
    if raw_token:
        try:
            email_service.send_password_reset_email(payload.email, raw_token)
        except email_service.EmailDeliveryError:
            logger.exception(
                "auth.password_reset_email_failed",
                extra={"event": "password_reset_email_failed", "email": payload.email},
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Password reset email could not be sent. Please try again later.",
            )
        logger.info(
            "auth.password_reset_email_sent",
            extra={"event": "password_reset_email_sent", "email": payload.email},
        )
    # Always return a generic success response to avoid leaking which emails are registered.
    return {"detail": "If that email is registered, a reset link has been sent."}


@router.post(
    "/reset-password",
    dependencies=[Depends(rate_limit_dependency(PASSWORD_RESET_RATE_LIMIT))],
)
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