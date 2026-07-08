"""Business logic for technician management (RF-26, RF-29)."""

from core.security import get_password_hash
from models.technician import TechnicianCreate
from repositories import organizations as organizations_repo
from repositories import technicians as technicians_repo
from repositories import users as users_repo
from services.billing_service import enforce_technician_limit


def create_technician(organization_id: int, payload: TechnicianCreate) -> dict:
    organization = organizations_repo.get_by_id(organization_id)
    current_count = users_repo.count_by_org_and_role(organization_id, "technician")
    enforce_technician_limit(organization, current_count)

    user_row = users_repo.create_user(
        organization_id=organization_id,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="technician",
    )

    technician_row = technicians_repo.create_technician(
        organization_id,
        user_row["id"],
        {
            "skills": payload.skills,
            "certifications": payload.certifications,
            "zone": payload.zone,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "max_daily_jobs": payload.max_daily_jobs,
        },
    )
    technician_row["users"] = {
        "full_name": user_row["full_name"],
        "email": user_row["email"],
        "is_active": user_row["is_active"],
    }
    return technician_row


def to_technician_response_dict(row: dict) -> dict:
    user_info = row.get("users") or {}
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "organization_id": row["organization_id"],
        "full_name": user_info.get("full_name", ""),
        "email": user_info.get("email", ""),
        "is_active": user_info.get("is_active", True),
        "skills": row.get("skills") or [],
        "certifications": row.get("certifications") or [],
        "zone": row.get("zone"),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "availability_status": row.get("availability_status", "available"),
        "max_daily_jobs": row.get("max_daily_jobs", 8),
    }
