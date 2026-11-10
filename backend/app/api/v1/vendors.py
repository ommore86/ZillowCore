from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, Vendor
from app.schemas.schemas import VendorCreate, VendorResponse

router = APIRouter(prefix="/vendors", tags=["Vendor & Workforce Management"])

@router.get("", response_model=List[VendorResponse])
def list_vendors(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Vendor).filter(Vendor.org_id == current_user.org_id)
    if category:
        q = q.filter(Vendor.service_category.ilike(f"%{category}%"))
    return q.order_by(Vendor.rating.desc()).all()

@router.post("", response_model=VendorResponse)
def create_vendor(
    payload: VendorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vendor = Vendor(
        org_id=current_user.org_id,
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        service_category=payload.service_category,
        rating=payload.rating,
        status="active",
        gst_number=payload.gst_number
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    log_audit_trail(db, current_user.org_id, "create", "vendor", vendor.id, user_id=current_user.id)
    return vendor

@router.put("/{id}/rating")
def update_vendor_rating(
    id: str,
    rating: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.id == id, Vendor.org_id == current_user.org_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.rating = max(1.0, min(5.0, rating))
    db.commit()
    return {"message": "Rating updated", "vendor_id": id, "rating": vendor.rating}

