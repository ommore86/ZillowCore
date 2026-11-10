from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, Deal, Property, Contact, FinancialTransaction
from app.schemas.schemas import DealCreate, DealResponse
from app.services.ai.ngqr import NeuralGeoSpatialQueryRouter

router = APIRouter(prefix="/sales", tags=["Sales, Deals & Transactions"])

@router.get("/deals", response_model=List[DealResponse])
def list_deals(
    stage: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Deal).filter(Deal.org_id == current_user.org_id)
    if stage:
        q = q.filter(Deal.stage == stage)
    return q.order_by(Deal.created_at.desc()).all()

@router.post("/deals", response_model=DealResponse)
def create_deal(
    payload: DealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    commission = round(payload.offer_amount * (payload.commission_rate / 100.0), 2)
    
    deal = Deal(
        org_id=current_user.org_id,
        property_id=payload.property_id,
        buyer_contact_id=payload.buyer_contact_id,
        seller_contact_id=payload.seller_contact_id,
        agent_user_id=payload.agent_user_id or current_user.id,
        title=payload.title,
        stage=payload.stage,
        offer_amount=payload.offer_amount,
        commission_rate=payload.commission_rate,
        commission_amount=commission,
        expected_close_date=payload.expected_close_date,
        notes=payload.notes
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    log_audit_trail(db, current_user.org_id, "create", "deal", deal.id, user_id=current_user.id)
    return deal

@router.put("/deals/{id}/stage")
def update_deal_stage(
    id: str,
    stage: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deal = db.query(Deal).filter(Deal.id == id, Deal.org_id == current_user.org_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    deal.stage = stage
    if stage == "closed":
        deal.closed_date = datetime.utcnow()
        # Record sales income transaction
        txn = FinancialTransaction(
            org_id=current_user.org_id,
            property_id=deal.property_id,
            type="sales_income",
            amount=deal.commission_amount,
            currency="INR",
            status="completed",
            category="Brokerage Commission",
            description=f"Commission earned on closing {deal.title}",
            reference_number=f"COMM-{deal.id[:8]}",
            is_verified=True
        )
        db.add(txn)

    log_audit_trail(db, current_user.org_id, "update_stage", "deal", deal.id, user_id=current_user.id)
    db.commit()
    return {"message": f"Deal transitioned to {stage}", "deal_id": id}

@router.post("/buyer-match")
def match_buyer_properties(
    buyer_prompt: str,
    target_limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI Recommendation Engine for matching prospective buyers to properties."""
    return NeuralGeoSpatialQueryRouter.route_spatial_intent(
        db=db,
        natural_language_query=buyer_prompt,
        target_result_limit=target_limit,
        org_id=current_user.org_id
    )

