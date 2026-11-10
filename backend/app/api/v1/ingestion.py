from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user
from app.models.models import User, IngestionPipeline
from app.schemas.schemas import RESOFeedValidationRequest, RESOAnomalyReport
from app.services.ai.reso_sandbox import AutonomousRESOIngestionSandbox

router = APIRouter(prefix="/ingestion", tags=["Autonomous RESO Ingestion Sandbox"])

@router.get("/pipelines")
def list_ingestion_pipelines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all active MLS/RESO data ingestion feeds and their self-healing status."""
    return db.query(IngestionPipeline).all()

@router.post("/test-feed")
def test_and_auto_heal_feed(
    payload: RESOFeedValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes Section 5 of the PDF: Autonomous RESO/Data Ingestion Sandbox.
    1. Anomaly Detection: Detects schema drifts from standard RESO API bindings.
    2. Code Generation: Drafts parsing schema adapter in Rust within micro-sandbox.
    3. Verification: Stream-tests binary against historical mock cache for 100% data extraction score.
    """
    return AutonomousRESOIngestionSandbox.inspect_and_auto_heal_feed(
        db=db,
        feed_name=payload.feed_name,
        incoming_payload=payload.sample_payload
    )

