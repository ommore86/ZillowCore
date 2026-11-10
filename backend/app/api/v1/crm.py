from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, Contact, Lead, CustomerInteraction
from app.schemas.schemas import (
    ContactCreate, ContactResponse, LeadCreate, LeadResponse,
    LeadStageUpdate
)

router = APIRouter(prefix="/crm", tags=["CRM & Leads Management"])

# Contacts
@router.get("/contacts", response_model=List[ContactResponse])
def list_contacts(
    contact_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Contact).filter(Contact.org_id == current_user.org_id)
    if contact_type:
        q = q.filter(Contact.contact_type == contact_type)
    if search:
        search_f = f"%{search}%"
        q = q.filter((Contact.full_name.ilike(search_f)) | (Contact.email.ilike(search_f)) | (Contact.phone.ilike(search_f)))
    return q.order_by(Contact.created_at.desc()).offset(offset).limit(limit).all()

@router.post("/contacts", response_model=ContactResponse)
def create_contact(
    payload: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = Contact(
        org_id=current_user.org_id,
        contact_type=payload.contact_type,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        lifecycle_stage=payload.lifecycle_stage,
        address=payload.address,
        notes=payload.notes
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    log_audit_trail(db, current_user.org_id, "create", "contact", contact.id, user_id=current_user.id)
    return contact

# Leads & 6-Stage Kanban Pipeline
@router.get("/leads", response_model=List[LeadResponse])
def list_leads(
    stage: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Lead).filter(Lead.org_id == current_user.org_id)
    if stage:
        q = q.filter(Lead.stage == stage)
    return q.order_by(Lead.lead_score.desc()).all()

@router.post("/leads", response_model=LeadResponse)
def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(Contact.id == payload.contact_id, Contact.org_id == current_user.org_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Initial AI Lead Scoring
    score = 55.0
    if payload.budget_max > 10000000:
        score += 20.0
    if payload.stage in ("site_visit", "negotiation"):
        score += 20.0

    lead = Lead(
        org_id=current_user.org_id,
        contact_id=payload.contact_id,
        assigned_to_user_id=payload.assigned_to_user_id or current_user.id,
        stage=payload.stage,
        lead_score=min(99.0, score),
        intent_vector={"budget_tier": "luxury" if payload.budget_max > 20000000 else "standard"},
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        preferred_location=payload.preferred_location,
        preferred_type=payload.preferred_type,
        source=payload.source,
        notes=payload.notes
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.put("/leads/{id}/stage", response_model=LeadResponse)
def update_lead_stage(
    id: str,
    payload: LeadStageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kanban drag-and-drop stage progression"""
    lead = db.query(Lead).filter(Lead.id == id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_stage = lead.stage
    lead.stage = payload.stage
    if payload.notes:
        lead.notes = f"{lead.notes or ''}\n[{datetime.utcnow().strftime('%Y-%m-%d')}]: Stage updated to {payload.stage}. {payload.notes}"

    # Log interaction
    interaction = CustomerInteraction(
        org_id=current_user.org_id,
        contact_id=lead.contact_id,
        user_id=current_user.id,
        channel="note",
        summary=f"Lead pipeline transitioned from '{old_stage}' to '{payload.stage}'."
    )
    db.add(interaction)
    db.commit()
    db.refresh(lead)
    return lead

# Interaction Timeline
@router.get("/contacts/{id}/timeline")
def get_contact_timeline(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(CustomerInteraction).filter(
        CustomerInteraction.contact_id == id,
        CustomerInteraction.org_id == current_user.org_id
    ).order_by(CustomerInteraction.timestamp.desc()).all()

@router.post("/contacts/{id}/interactions")
def log_contact_interaction(
    id: str,
    channel: str,
    summary: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(Contact.id == id, Contact.org_id == current_user.org_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    inter = CustomerInteraction(
        org_id=current_user.org_id,
        contact_id=id,
        user_id=current_user.id,
        channel=channel,
        summary=summary
    )
    db.add(inter)
    db.commit()
    db.refresh(inter)
    return inter

