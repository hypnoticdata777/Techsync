"""
FastAPI dependencies for authentication, tenant scoping, and role checks
(RF-02, RF-05).
"""

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.security import decode_token
from models.user import User
from repositories import organizations as organizations_repo
from repositories import users as users_repo

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Validate a JWT access token and return the current, org-scoped user."""
    payload = decode_token(credentials.credentials, expected_type="access")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_row = users_repo.get_by_id_in_org(payload["user_id"], payload["organization_id"])
    if user_row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user_row["is_active"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    return User(
        id=user_row["id"],
        organization_id=user_row["organization_id"],
        email=user_row["email"],
        full_name=user_row["full_name"],
        role=user_row["role"],
        is_active=user_row["is_active"],
    )


async def get_current_organization(current_user: User = Depends(get_current_user)) -> dict:
    """Loads the caller's organization row and rejects requests against a
    soft-deleted tenant (RNF-13)."""
    organization = organizations_repo.get_by_id(current_user.organization_id)
    if organization is None or organization.get("deleted_at"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return organization


async def get_organization_from_api_key(x_api_key: str = Header(...)) -> dict:
    """RF-11: authenticate external webhook callers by per-org API key, not a
    user JWT -- the caller is an external system, not a logged-in user."""
    organization = organizations_repo.get_by_api_key(x_api_key)
    if organization is None or organization.get("deleted_at"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return organization


def require_roles(*allowed_roles: str):
    """Dependency factory: Depends(require_roles("org_admin", "coordinator"))"""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This operation requires one of these roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
