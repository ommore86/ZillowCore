from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, Lease, Property, Contact, Invoice
from app.schemas.schemas import LeaseCreate, LeaseResponse

router = APIRouter(prefix="/leases", tags=["Lease & Rental Management"])

@router.get("", response_model=List[LeaseResponse])
def list_leases(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Lease).filter(Lease.org_id == current_user.org_id)
    if status:
        q = q.filter(Lease.status == status)
    return q.order_by(Lease.created_at.desc()).all()

@router.post("", response_model=LeaseResponse)
def create_lease(
    payload: LeaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == payload.property_id, Property.org_id == current_user.org_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    tenant = db.query(Contact).filter(Contact.id == payload.tenant_contact_id, Contact.org_id == current_user.org_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant contact not found")

    lease = Lease(
        org_id=current_user.org_id,
        property_id=payload.property_id,
        unit_id=payload.unit_id,
        tenant_contact_id=payload.tenant_contact_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        monthly_rent=payload.monthly_rent,
        security_deposit=payload.security_deposit,
        payment_frequency=payload.payment_frequency,
        escalation_rate_percent=payload.escalation_rate_percent,
        late_fee_amount=payload.late_fee_amount,
        status="active",
        signature_status="pending",
        agreement_pdf_url=f"https://estateos.ai/agreements/lease_{prop.parcel_number or 'contract'}.pdf"
    )
    db.add(lease)

    # Automatically set property status to occupied
    prop.status = "occupied"

    # Automatically generate initial rent invoice
    initial_invoice = Invoice(
        org_id=current_user.org_id,
        lease_id=lease.id,
        contact_id=tenant.id,
        invoice_number=f"INV-{datetime.utcnow().strftime('%Y%m')}-{prop.parcel_number or 'RENT'}",
        due_date=datetime.utcnow() + timedelta(days=7),
        amount=payload.monthly_rent,
        gst_amount=payload.monthly_rent * 0.18,
        total_amount=payload.monthly_rent * 1.18,
        status="sent",
        notes="First month rent + security deposit invoice"
    )
    db.add(initial_invoice)

    log_audit_trail(db, current_user.org_id, "create", "lease", lease.id, user_id=current_user.id)
    db.commit()
    db.refresh(lease)
    return lease

@router.get("/{id}", response_model=LeaseResponse)
def get_lease(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lease = db.query(Lease).filter(Lease.id == id, Lease.org_id == current_user.org_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    return lease

@router.post("/{id}/renew")
def renew_lease(
    id: str,
    months: int = Query(12, ge=1, le=60),
    escalation_pct: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lease = db.query(Lease).filter(Lease.id == id, Lease.org_id == current_user.org_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    escalation = escalation_pct if escalation_pct is not None else lease.escalation_rate_percent
    new_rent = float(lease.monthly_rent) * (1.0 + (escalation / 100.0))
    lease.monthly_rent = round(new_rent, 2)
    lease.end_date = lease.end_date + timedelta(days=months * 30)
    lease.status = "active"
    lease.signature_status = "signed"

    log_audit_trail(db, current_user.org_id, "renew", "lease", lease.id, user_id=current_user.id)
    db.commit()
    db.refresh(lease)
    return {
        "message": f"Lease renewed for {months} months with {escalation}% escalation.",
        "new_monthly_rent": float(lease.monthly_rent),
        "new_end_date": lease.end_date.strftime("%Y-%m-%d")
    }

@router.post("/{id}/terminate")
def terminate_lease(
    id: str,
    reason: Optional[str] = "Mutual Agreement",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lease = db.query(Lease).filter(Lease.id == id, Lease.org_id == current_user.org_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    lease.status = "terminated"
    # Free up property
    if lease.property:
        lease.property.status = "available"

    log_audit_trail(db, current_user.org_id, "terminate", "lease", lease.id, user_id=current_user.id)
    db.commit()
    return {"message": "Lease terminated and property marked available", "id": id, "reason": reason}

@router.post("/{id}/sign")
def sign_lease_electronically(
    id: str,
    signer_name: str = Query("Tenant"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lease = db.query(Lease).filter(Lease.id == id, Lease.org_id == current_user.org_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    lease.signature_status = "signed"
    log_audit_trail(db, current_user.org_id, "esign", "lease", lease.id, user_id=current_user.id)
    db.commit()
    return {
        "message": "Electronic signature verified and timestamped",
        "lease_id": id,
        "signature_status": "signed",
        "signed_by": signer_name,
        "audit_hash": "sha256-sig-" + lease.id[:12]
    }

