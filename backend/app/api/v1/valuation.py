from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user
from app.models.models import User, Property, PropertyMasterLedger
from app.schemas.schemas import ValuationRequest, ValuationResponse
from app.services.ai.mve import MultimodalValuationEngine

router = APIRouter(prefix="/valuation", tags=["Multimodal Valuation Engine (MVE)"])

@router.post("/calculate", response_model=ValuationResponse)
def calculate_property_valuation(
    payload: ValuationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes Module B: Multimodal Valuation Engine (MVE) — The Autonomous Zestimate (from PDF p.4-5).
    Combines spatial regression indexing with Vision-Language-Action (VLA) computer vision cues,
    interior texture analysis, and macroeconomic indicators.
    """
    city = "mumbai"
    if payload.property_id:
        prop = db.query(Property).filter(Property.id == payload.property_id, Property.org_id == current_user.org_id).first()
        if prop:
            city = prop.city

    result = MultimodalValuationEngine.calculate_valuation(
        db=db,
        area_sqft=payload.area_sqft,
        bedrooms=payload.bedrooms,
        bathrooms=payload.bathrooms,
        property_type=payload.property_type,
        city=city,
        amenities=payload.amenities,
        interior_features=payload.interior_features,
        property_id=payload.property_id
    )
    return ValuationResponse(**result)

@router.get("/{property_id}", response_model=ValuationResponse)
def get_property_valuation_details(
    property_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id, Property.org_id == current_user.org_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    result = MultimodalValuationEngine.calculate_valuation(
        db=db,
        area_sqft=prop.area_sqft,
        bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms,
        property_type=prop.property_type,
        city=prop.city,
        amenities=prop.amenities,
        property_id=prop.id
    )
    return ValuationResponse(**result)

