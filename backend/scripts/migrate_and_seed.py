import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Migration] %(message)s")
logger = logging.getLogger("estateos-migration")

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.services.ai.orchestrator import MultiAgentOrchestrator

def main():
    logger.info("================================================================")
    logger.info("   EstateOS AI — Production Database Migration & Seeding Tool   ")
    logger.info("================================================================")
    
    db_target = settings.DATABASE_URL
    masked_target = db_target.split("@")[-1] if "@" in db_target else db_target[:20]
    logger.info(f"Target Database: {masked_target}")

    logger.info("[1/3] Verifying and applying database schema migrations...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables and indexes created/verified successfully.")

    logger.info("[2/3] Checking enterprise multi-tenant seed data...")
    db = SessionLocal()
    try:
        org_id = seed_database(db)
        logger.info(f"Enterprise organization verified (Org ID: {org_id}).")
    except Exception as e:
        logger.error(f"Seeding check encountered an issue: {e}")
        db.rollback()
        raise
    finally:
        db.close()

    logger.info("[3/3] Registering 24 specialized LangGraph domain agents...")
    db = SessionLocal()
    try:
        MultiAgentOrchestrator.ensure_agents_registered(db)
        logger.info("All 24 domain agents registered in persistent catalog.")
    finally:
        db.close()

    logger.info("================================================================")
    logger.info("Database migration and safe seeding completed successfully.")
    logger.info("================================================================")

if __name__ == "__main__":
    main()

