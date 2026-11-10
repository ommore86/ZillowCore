import uuid
import secrets
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, APIKey, Webhook
from app.schemas.schemas import (
    APIKeyCreate, APIKeyResponse, WebhookCreate, WebhookResponse
)

router = APIRouter(prefix="/developer", tags=["Developer Platform & APIs"])

# API Key Management
@router.get("/keys", response_model=List[APIKeyResponse])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(APIKey).filter(APIKey.org_id == current_user.org_id, APIKey.is_active == True).all()

@router.post("/keys", response_model=APIKeyResponse)
def generate_api_key(
    payload: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_key = f"eos_live_{secrets.token_hex(20)}"
    prefix = raw_key[:14]
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    api_key_obj = APIKey(
        org_id=current_user.org_id,
        user_id=current_user.id,
        name=payload.name,
        key_prefix=prefix,
        key_hash=key_hash,
        role=payload.role or "property_manager",
        rate_limit_per_minute=payload.rate_limit_per_minute or 120,
        is_active=True
    )
    db.add(api_key_obj)
    db.commit()
    db.refresh(api_key_obj)

    # Attach raw key ONLY once on creation
    res = APIKeyResponse.from_orm(api_key_obj)
    res.raw_key = raw_key
    log_audit_trail(db, current_user.org_id, "generate_api_key", "api_key", api_key_obj.id, user_id=current_user.id)
    return res

@router.delete("/keys/{id}")
def revoke_api_key(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    key_obj = db.query(APIKey).filter(APIKey.id == id, APIKey.org_id == current_user.org_id).first()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API Key not found")

    key_obj.is_active = False
    log_audit_trail(db, current_user.org_id, "revoke_api_key", "api_key", key_obj.id, user_id=current_user.id)
    db.commit()
    return {"message": "API Key revoked successfully", "id": id}

# Webhooks
@router.get("/webhooks", response_model=List[WebhookResponse])
def list_webhooks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Webhook).filter(Webhook.org_id == current_user.org_id).all()

@router.post("/webhooks", response_model=WebhookResponse)
def register_webhook(
    payload: WebhookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    secret = payload.secret_token or f"whsec_{secrets.token_hex(16)}"
    webhook = Webhook(
        org_id=current_user.org_id,
        target_url=payload.target_url,
        event_types=payload.event_types,
        secret_token=secret,
        is_active=True
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    log_audit_trail(db, current_user.org_id, "register_webhook", "webhook", webhook.id, user_id=current_user.id)
    return webhook

@router.get("/sdk-snippets")
def get_sdk_snippets():
    """Returns sample SDK integration code for developer quickstart."""
    return {
        "python": """import requests

ESTATEOS_URL = "http://localhost:8000/api/v1"
API_KEY = "eos_live_YOUR_KEY_HERE"

headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

# 1. Spatial Search with Neural Geo-Spatial Query Router (NGQR)
resp = requests.post(f"{ESTATEOS_URL}/geospatial/route-intent", headers=headers, json={
    "natural_language_query": "3BHK luxury apartment in Mumbai under 4.5 Crore",
    "target_result_limit": 5
})
print("Matched Properties:", resp.json())

# 2. Continuous Multimodal Valuation (MVE)
val_resp = requests.post(f"{ESTATEOS_URL}/valuation/calculate", headers=headers, json={
    "area_sqft": 1850,
    "bedrooms": 3,
    "property_type": "apartment",
    "city": "Mumbai",
    "amenities": ["Italian Marble", "Smart Home Automation"]
})
print("Autonomous Zestimate:", val_resp.json())""",
        "typescript": """import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'X-API-Key': 'eos_live_YOUR_KEY_HERE' }
});

async function main() {
  const { data } = await client.post('/geospatial/route-intent', {
    natural_language_query: 'Modern villa in Northeast Bhopal under 2 Crore',
    target_result_limit: 5
  });
  console.log('Results:', data.matched_properties);
}
main();""",
        "curl": """# Neural Geo-Spatial Intent Query
curl -X POST "http://localhost:8000/api/v1/geospatial/route-intent" \\
  -H "X-API-Key: eos_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"natural_language_query": "Commercial office in BKC Mumbai", "target_result_limit": 5}'"""
    }

