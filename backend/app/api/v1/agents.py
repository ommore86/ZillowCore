from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, AIAgent, AgentTask, Approval
from app.schemas.schemas import (
    AIAgentResponse, AgentExecutionRequest, AgentTaskResponse,
    ApprovalResponse, ApprovalDecisionRequest
)
from app.services.ai.orchestrator import MultiAgentOrchestrator

router = APIRouter(prefix="/agents", tags=["AI-Native Multi-Agent Orchestration"])

@router.get("/registry", response_model=List[AIAgentResponse])
def get_agent_registry(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all 24 registered specialized enterprise agents and their operational status."""
    MultiAgentOrchestrator.ensure_agents_registered(db)
    return db.query(AIAgent).all()

@router.post("/execute", response_model=AgentTaskResponse)
def execute_agent_task(
    payload: AgentExecutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dispatches a task to a specialized agent via the Master Orchestrator."""
    result = MultiAgentOrchestrator.execute_agent_task(
        db=db,
        agent_code=payload.agent_code,
        task_type=payload.task_type,
        input_payload=payload.input_payload,
        org_id=current_user.org_id,
        user_id=current_user.id,
        require_approval=payload.require_approval
    )
    task_record = db.query(AgentTask).filter(AgentTask.id == result["task_id"]).first()
    if not task_record:
        raise HTTPException(status_code=500, detail="Failed to retrieve execution record")
    return task_record

@router.get("/tasks", response_model=List[AgentTaskResponse])
def list_agent_tasks(
    agent_code: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns persistent execution logs, token counts, and durations."""
    q = db.query(AgentTask).filter(AgentTask.org_id == current_user.org_id)
    if agent_code:
        q = q.filter(AgentTask.agent_code == agent_code)
    return q.order_by(AgentTask.created_at.desc()).limit(50).all()

# Human-in-the-Loop Approvals
@router.get("/approvals/pending", response_model=List[ApprovalResponse])
def list_pending_approvals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves sensitive tasks awaiting human approval."""
    return db.query(Approval).filter(
        Approval.org_id == current_user.org_id,
        Approval.status == "pending"
    ).order_by(Approval.created_at.desc()).all()

@router.post("/approvals/{id}/decide")
def decide_approval(
    id: str,
    payload: ApprovalDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Records human-in-the-loop sign-off (approved or rejected)."""
    approval = db.query(Approval).filter(Approval.id == id, Approval.org_id == current_user.org_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = payload.decision
    approval.reviewed_by_user_id = current_user.id
    approval.decided_at = datetime.utcnow()

    # Update associated task status
    if approval.task_id:
        task = db.query(AgentTask).filter(AgentTask.id == approval.task_id).first()
        if task:
            task.status = "completed" if payload.decision == "approved" else "rejected"

    log_audit_trail(
        db, current_user.org_id, f"approval_{payload.decision}",
        "approval", approval.id, user_id=current_user.id,
        details={"decision": payload.decision, "comments": payload.comments}
    )
    db.commit()
    return {
        "message": f"Task approval decision '{payload.decision}' successfully recorded.",
        "approval_id": id,
        "status": approval.status
    }

