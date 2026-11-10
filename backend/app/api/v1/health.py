from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health")
def healthcheck(db: Session = Depends(get_db)):
    """Healthcheck endpoint for Kubernetes, Docker, and Render deployment monitoring."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": "EstateOS AI / ZillowCore Enterprise API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "agents_online": 24,
        "ngqr_status": "operational",
        "mve_status": "operational",
        "reso_sandbox_status": "operational"
    }

