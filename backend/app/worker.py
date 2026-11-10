import os
import sys
import time
import signal
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [AI-Worker] %(message)s"
)
logger = logging.getLogger("estateos-ai-worker")

# Ensure app can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import (
    Organization, AgentTask, Lease, MaintenanceTicket,
    Invoice, Property, WorkflowDefinition
)
from app.services.ai.orchestrator import MultiAgentOrchestrator
from app.services.seed_data import seed_database

class EstateOSAIWorker:
    def __init__(self):
        self.running = True
        self.iteration_count = 0
        self.tasks_processed = 0
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        """Attempts to connect to managed Redis for task queues and pub/sub."""
        try:
            import redis
            if settings.REDIS_URL:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                logger.info(f"Connected to Redis message broker at {settings.REDIS_URL[:25]}...")
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}). Falling back to database-backed task polling queue.")
            self.redis_client = None

    def stop(self, *args):
        logger.info("Received termination signal. Shutting down AI Background Worker gracefully...")
        self.running = False

    def process_pending_agent_tasks(self, db):
        """Pulls and executes pending asynchronous agent tasks from queue."""
        pending_tasks = db.query(AgentTask).filter(AgentTask.status == "pending").limit(10).all()
        for task in pending_tasks:
            try:
                logger.info(f"Executing queued task {task.id} via agent: {task.agent_code}")
                task.status = "in_progress"
                db.commit()

                res = MultiAgentOrchestrator.execute_agent_task(
                    db=db,
                    agent_code=task.agent_code,
                    task_type=task.task_type,
                    input_payload=task.input_payload or {},
                    org_id=task.org_id,
                    user_id=task.user_id,
                    require_approval=task.status == "requires_approval"
                )
                self.tasks_processed += 1
                logger.info(f"Completed task {task.id} (Agent: {task.agent_code}) successfully.")
            except Exception as e:
                logger.error(f"Task {task.id} failed: {e}")
                task.status = "failed"
                task.error_message = str(e)
                db.commit()

    def run_scheduled_automations(self, db):
        """Executes scheduled autonomous monitoring workflows across all organizations."""
        orgs = db.query(Organization).all()
        for org in orgs:
            # 1. Automated Rent Dunning & Delinquency Check
            try:
                rent_summary = MultiAgentOrchestrator._run_rent_collection(db, org.id, {})
                if rent_summary.get("delinquent_count", 0) > 0:
                    logger.info(
                        f"Org [{org.name[:20]}]: Rent Collection Agent identified "
                        f"{rent_summary['delinquent_count']} delinquent accounts totaling ₹{rent_summary['total_outstanding']:,.0f}"
                    )
            except Exception as e:
                logger.error(f"Rent collection monitoring error: {e}")

            # 2. Maintenance SLA Escalation Scan
            try:
                open_tickets = db.query(MaintenanceTicket).filter(
                    MaintenanceTicket.org_id == org.id,
                    MaintenanceTicket.status.in_(["reported", "triaged", "assigned"])
                ).all()
                for ticket in open_tickets:
                    elapsed_hours = (datetime.utcnow() - ticket.created_at).total_seconds() / 3600.0
                    sla_limit = 4.0 if ticket.priority == "urgent" else (24.0 if ticket.priority == "high" else 72.0)
                    if elapsed_hours > sla_limit:
                        logger.warning(
                            f"SLA Breached: Ticket {ticket.ticket_number} ({ticket.title}) open for {elapsed_hours:.1f}h (SLA limit: {sla_limit}h)"
                        )
            except Exception as e:
                logger.error(f"Maintenance ticket monitoring error: {e}")

            # 3. Lease Expiration Sentinel (30/60 days alert)
            try:
                horizon_date = datetime.utcnow() + timedelta(days=60)
                expiring_leases = db.query(Lease).filter(
                    Lease.org_id == org.id,
                    Lease.status == "active",
                    Lease.end_date <= horizon_date
                ).all()
                if expiring_leases:
                    logger.info(f"Org [{org.name[:20]}]: Lease Sentinel flagged {len(expiring_leases)} leases expiring within 60 days.")
            except Exception as e:
                logger.error(f"Lease expiration sentinel error: {e}")

    def run(self):
        logger.info("================================================================")
        logger.info("   EstateOS AI — Autonomous Multi-Agent Background Worker Daemon ")
        logger.info("                  24 Domain Agents Orchestration                 ")
        logger.info("================================================================")

        # Ensure database tables exist
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()

        signal.signal(signal.SIGINT, self.stop)
        signal.signal(signal.SIGTERM, self.stop)

        logger.info("AI Background Worker is operational. Listening for tasks and scheduling...")

        while self.running:
            self.iteration_count += 1
            db = SessionLocal()
            try:
                # 1. Process explicit queued agent tasks
                self.process_pending_agent_tasks(db)

                # 2. Run scheduled automations every 30 seconds
                if self.iteration_count % 3 == 0:
                    self.run_scheduled_automations(db)

                # Heartbeat logging
                if self.iteration_count % 6 == 0:
                    logger.info(
                        f"Heartbeat: 24 domain agents active | Tasks processed: {self.tasks_processed} | "
                        f"Status: Healthy | Timestamp: {datetime.utcnow().isoformat()}"
                    )
            except Exception as e:
                logger.error(f"Worker iteration loop error: {e}")
            finally:
                db.close()

            # Sleep 10 seconds between queue polls
            time.sleep(10)

        logger.info("AI Background Worker terminated cleanly.")

if __name__ == "__main__":
    worker = EstateOSAIWorker()
    worker.run()

