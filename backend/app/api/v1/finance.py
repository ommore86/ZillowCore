from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.middleware import get_current_user, log_audit_trail
from app.models.models import User, FinancialTransaction, Invoice, Lease, Property
from app.schemas.schemas import (
    InvoiceCreate, InvoiceResponse,
    FinancialTransactionCreate, FinancialTransactionResponse
)

router = APIRouter(prefix="/finance", tags=["Financial Management & Accounting"])

# Invoices
@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Invoice).filter(Invoice.org_id == current_user.org_id)
    if status:
        q = q.filter(Invoice.status == status)
    return q.order_by(Invoice.created_at.desc()).all()

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    payload: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gst = payload.gst_amount if payload.gst_amount else round(payload.amount * 0.18, 2)
    total = round(payload.amount + gst, 2)

    inv = Invoice(
        org_id=current_user.org_id,
        lease_id=payload.lease_id,
        contact_id=payload.contact_id,
        invoice_number=payload.invoice_number,
        due_date=payload.due_date,
        amount=payload.amount,
        gst_amount=gst,
        total_amount=total,
        status="sent",
        notes=payload.notes
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    log_audit_trail(db, current_user.org_id, "create", "invoice", inv.id, user_id=current_user.id)
    return inv

@router.put("/invoices/{id}/pay", response_model=InvoiceResponse)
def mark_invoice_paid(
    id: str,
    payment_method: str = Query("Bank Transfer"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Invoice).filter(Invoice.id == id, Invoice.org_id == current_user.org_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.status = "paid"

    # Record Verified Double-Entry Transaction Ledger
    txn = FinancialTransaction(
        org_id=current_user.org_id,
        lease_id=inv.lease_id,
        type="rental_income",
        amount=inv.total_amount,
        currency="INR",
        status="completed",
        category="Rental Income Settlement",
        description=f"Settled invoice {inv.invoice_number} via {payment_method}",
        reference_number=f"TXN-SETTLE-{inv.invoice_number}",
        is_verified=True
    )
    db.add(txn)
    log_audit_trail(db, current_user.org_id, "pay", "invoice", inv.id, user_id=current_user.id)
    db.commit()
    db.refresh(inv)
    return inv

# Transactions Ledger
@router.get("/transactions", response_model=List[FinancialTransactionResponse])
def list_transactions(
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FinancialTransaction).filter(FinancialTransaction.org_id == current_user.org_id)
    if type:
        q = q.filter(FinancialTransaction.type == type)
    return q.order_by(FinancialTransaction.date.desc()).all()

@router.post("/transactions", response_model=FinancialTransactionResponse)
def record_transaction(
    payload: FinancialTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txn = FinancialTransaction(
        org_id=current_user.org_id,
        property_id=payload.property_id,
        lease_id=payload.lease_id,
        type=payload.type,
        amount=payload.amount,
        currency=payload.currency,
        status=payload.status,
        category=payload.category,
        description=payload.description,
        reference_number=payload.reference_number or f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        is_verified=True
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    log_audit_trail(db, current_user.org_id, "record", "transaction", txn.id, user_id=current_user.id)
    return txn

# Profit & Loss Statement and Financial Metrics
@router.get("/pnl")
def get_pnl_statement(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txns = db.query(FinancialTransaction).filter(FinancialTransaction.org_id == current_user.org_id).all()
    
    rental_income = sum(float(t.amount) for t in txns if t.type in ("rental_income", "sales_income"))
    expenses = sum(float(t.amount) for t in txns if t.type in ("property_expense", "maintenance_expense", "vendor_payment"))
    noi = rental_income - expenses

    return {
        "gross_revenue": rental_income,
        "operating_expenses": expenses,
        "net_operating_income": noi,
        "noi_margin_percent": round((noi / rental_income * 100.0), 1) if rental_income > 0 else 0.0,
        "reporting_currency": current_user.organization.currency,
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/metrics")
def get_finance_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mrr = db.query(func.sum(Lease.monthly_rent)).filter(Lease.org_id == current_user.org_id, Lease.status == "active").scalar() or 0.0
    outstanding = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.org_id == current_user.org_id,
        Invoice.status.in_(["sent", "overdue"])
    ).scalar() or 0.0
    total_paid = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.org_id == current_user.org_id,
        Invoice.status == "paid"
    ).scalar() or 0.0

    return {
        "monthly_recurring_revenue": float(mrr),
        "outstanding_receivables": float(outstanding),
        "total_collected": float(total_paid),
        "currency": current_user.organization.currency
    }

