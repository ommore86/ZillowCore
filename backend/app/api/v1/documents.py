from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, Document
from app.schemas.schemas import DocumentCreate, DocumentResponse
from app.services.ai.orchestrator import MultiAgentOrchestrator
from app.services.storage import StorageService

router = APIRouter(prefix="/documents", tags=["Document Vault & OCR Intelligence"])

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    document_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Document).filter(Document.org_id == current_user.org_id)
    if document_type:
        q = q.filter(Document.document_type == document_type)
    return q.order_by(Document.created_at.desc()).all()

@router.post("", response_model=DocumentResponse)
def upload_document_record(
    payload: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Analyze text with Document Intelligence Agent if OCR text supplied
    meta = payload.metadata_json or {}
    if payload.ocr_extracted_text and not meta:
        ai_res = MultiAgentOrchestrator._run_document_intelligence(
            db, current_user.org_id, {"text": payload.ocr_extracted_text}
        )
        meta = ai_res.get("extracted_fields", {})

    doc = Document(
        org_id=current_user.org_id,
        property_id=payload.property_id,
        lease_id=payload.lease_id,
        title=payload.title,
        document_type=payload.document_type,
        file_url=payload.file_url,
        file_format=payload.file_format,
        file_size_bytes=payload.file_size_bytes,
        ocr_extracted_text=payload.ocr_extracted_text,
        metadata_json=meta,
        expiration_date=payload.expiration_date or (datetime.utcnow() + timedelta(days=365)),
        is_verified=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    log_audit_trail(db, current_user.org_id, "upload", "document", doc.id, user_id=current_user.id)
    return doc

@router.post("/analyze-ocr")
def analyze_document_ocr(
    raw_text: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invokes Document Intelligence Agent to extract metadata and key clauses."""
    return MultiAgentOrchestrator._run_document_intelligence(db, current_user.org_id, {"text": raw_text})

@router.post("/upload-file", response_model=DocumentResponse)
async def upload_document_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    document_type: str = Form("contract"),
    property_id: Optional[str] = Form(None),
    lease_id: Optional[str] = Form(None),
    ocr_extracted_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads a binary document file to persistent storage and indexes OCR metadata."""
    content = await file.read()
    file_format = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "bin"
    file_url = StorageService.upload_file(
        file_bytes=content,
        filename=file.filename or "uploaded_document",
        content_type=file.content_type,
        folder="documents"
    )

    doc_title = title or file.filename or "Uploaded Document"
    meta = {}
    if ocr_extracted_text:
        ai_res = MultiAgentOrchestrator._run_document_intelligence(
            db, current_user.org_id, {"text": ocr_extracted_text}
        )
        meta = ai_res.get("extracted_fields", {})

    doc = Document(
        org_id=current_user.org_id,
        property_id=property_id,
        lease_id=lease_id,
        title=doc_title,
        document_type=document_type,
        file_url=file_url,
        file_format=file_format,
        file_size_bytes=len(content),
        ocr_extracted_text=ocr_extracted_text or f"Stored at {file_url}",
        metadata_json=meta,
        expiration_date=datetime.utcnow() + timedelta(days=365),
        is_verified=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    log_audit_trail(db, current_user.org_id, "upload", "document", doc.id, user_id=current_user.id)
    return doc

