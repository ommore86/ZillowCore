from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, WorkflowDefinition, WorkflowExecution
from app.schemas.schemas import WorkflowCreate, WorkflowResponse

router = APIRouter(prefix="/automations", tags=["Agentic Workflow Automation"])

@router.get("", response_model=List[WorkflowResponse])
def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(WorkflowDefinition).filter(WorkflowDefinition.org_id == current_user.org_id).all()

@router.post("", response_model=WorkflowResponse)
def create_workflow(
    payload: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wf = WorkflowDefinition(
        org_id=current_user.org_id,
        name=payload.name,
        description=payload.description,
        trigger_event=payload.trigger_event,
        is_active=True,
        nodes_json=payload.nodes_json,
        edges_json=payload.edges_json
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)
    log_audit_trail(db, current_user.org_id, "create", "workflow", wf.id, user_id=current_user.id)
    return wf

@router.post("/{id}/trigger")
def trigger_workflow(
    id: str,
    trigger_payload: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wf = db.query(WorkflowDefinition).filter(WorkflowDefinition.id == id, WorkflowDefinition.org_id == current_user.org_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow definition not found")

    payload = trigger_payload or {"source": "manual_trigger", "triggered_by": current_user.email}
    
    # Execute workflow nodes simulation
    execution_logs = [
        {"timestamp": datetime.utcnow().isoformat(), "step": "Trigger Evaluated", "status": "success", "event": wf.trigger_event},
        {"timestamp": datetime.utcnow().isoformat(), "step": "AI Agent Dispatched", "status": "success", "node_count": len(wf.nodes_json)},
        {"timestamp": datetime.utcnow().isoformat(), "step": "Workflow Completed", "status": "success"}
    ]

    exec_record = WorkflowExecution(
        org_id=current_user.org_id,
        workflow_id=wf.id,
        status="completed",
        trigger_payload=payload,
        execution_log_json=execution_logs
    )
    db.add(exec_record)
    log_audit_trail(db, current_user.org_id, "trigger", "workflow", wf.id, user_id=current_user.id)
    db.commit()

    return {
        "message": f"Workflow '{wf.name}' executed successfully.",
        "execution_id": exec_record.id,
        "status": "completed",
        "nodes_processed": len(wf.nodes_json),
        "logs": execution_logs
    }

@router.get("/executions")
def list_workflow_executions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(WorkflowExecution).filter(WorkflowExecution.org_id == current_user.org_id).order_by(WorkflowExecution.created_at.desc()).limit(30).all()

