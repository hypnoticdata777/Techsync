"""Organization member listing and role management (RF-02)."""

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_organization, require_roles
from models.user import UpdateUserRole, User
from repositories import users as users_repo

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[User])
def list_org_users(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = users_repo.list_by_org(organization["id"])
    return [User(**row) for row in rows]


@router.patch("/{user_id}/role", response_model=User)
def update_user_role(
    user_id: int,
    payload: UpdateUserRole,
    current_user: User = Depends(require_roles("org_admin")),
    organization: dict = Depends(get_current_organization),
):
    updated = users_repo.update_role_and_status(user_id, organization["id"], {"role": payload.role})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return User(**updated)
