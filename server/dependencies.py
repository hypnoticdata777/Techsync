"""
FastAPI dependencies for authentication and authorization.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth import decode_access_token, User
from supabase_client import get_supabase_client, SupabaseNotConfigured

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Validate JWT token and return the current user.
    Raises HTTPException if token is invalid or user not found.
    """
    token = credentials.credentials
    token_data = decode_access_token(token)

    if token_data is None or token_data.email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    try:
        client = get_supabase_client()
        response = client.table("users").select("*").eq("email", token_data.email).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        user_data = response.data[0]
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            is_active=user_data["is_active"],
        )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        return user

    except SupabaseNotConfigured:
        # For development/testing without database
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication requires database configuration",
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user (already checked in get_current_user)."""
    return current_user


def require_role(required_role: str):
    """
    Dependency factory to require a specific role.
    Usage: Depends(require_role("admin"))
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This operation requires {required_role} role",
            )
        return current_user

    return role_checker
