from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, Organization
from app.schemas.schemas import OrganizationResponse, OrganizationUpdate, UserResponse

router = APIRouter(prefix="/organization", tags=["Organization & Tenant Management"])

@router.get("", response_model=OrganizationResponse)
def get_current_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("", response_model=OrganizationResponse)
def update_current_organization(
    payload: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.name:
        org.name = payload.name
    if payload.currency:
        org.currency = payload.currency
    if payload.tax_rate is not None:
        org.tax_rate = payload.tax_rate
    if payload.settings:
        current_settings = dict(org.settings or {})
        current_settings.update(payload.settings)
        org.settings = current_settings

    log_audit_trail(db, current_user.org_id, "update", "organization", org.id, user_id=current_user.id)
    db.commit()
    db.refresh(org)
    return org

@router.get("/team", response_model=List[UserResponse])
def get_organization_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists organization team members across the 14 RBAC enterprise roles."""
    return db.query(User).filter(User.org_id == current_user.org_id).order_by(User.created_at.asc()).all()

