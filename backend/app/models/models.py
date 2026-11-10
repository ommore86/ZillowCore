import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime,
    ForeignKey, Numeric, Enum as SQLEnum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# ==============================================================================
# 1. ORGANIZATIONS & TENANT ISOLATION
# ==============================================================================

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    domain = Column(String(255), nullable=True)
    subscription_tier = Column(String(50), default="enterprise")
    currency = Column(String(10), default="INR")  # Supports INR / USD
    tax_rate = Column(Float, default=18.0)  # GST 18% standard
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="organization", cascade="all, delete-orphan")

# ==============================================================================
# 2. USERS & 14-ROLE ENTERPRISE RBAC
# ==============================================================================

ROLES_LIST = [
    "super_admin",
    "org_owner",
    "org_admin",
    "property_manager",
    "real_estate_agent",
    "accountant",
    "facility_manager",
    "maintenance_staff",
    "legal_officer",
    "vendor",
    "landlord",
    "tenant",
    "investor",
    "readonly_analyst"
]

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="property_manager", nullable=False)
    is_active = Column(Boolean, default=True)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

    __table_args__ = (
        UniqueConstraint("org_id", "email", name="uq_org_email"),
    )

# ==============================================================================
# 3. ZILLOWCORE SPECIFICATION: PROPERTY MASTER LEDGER (FROM PDF SPEC)
# ==============================================================================

class PropertyMasterLedger(Base):
    """
    Core Real Estate Structural Ledger managed by the Data Fabric (from PDF p.5).
    Contains parcel identifier, spatial coordinates, structural attributes JSON,
    interior visual embeddings (1536-dim), continuous valuation, and confidence matrix.
    """
    __tablename__ = "property_master_ledger"

    property_id = Column(String(36), primary_key=True, default=generate_uuid)
    parcel_number = Column(String(100), unique=True, nullable=False, index=True)
    # Stored as GeoJSON / WKT coordinate structure: {"type": "Point", "coordinates": [longitude, latitude]}
    geo_location = Column(JSON, nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    geohash = Column(String(12), nullable=False, index=True)
    # Structural features (beds, baths, area, year_built, style, etc.)
    structural_attributes = Column(JSON, nullable=False)
    # 1536-dim interior visual embedding derived from computer vision parsing
    interior_visual_embedding = Column(JSON, nullable=True)
    current_valuation_amount = Column(Numeric(15, 2), nullable=False)
    # Valuation confidence matrix (confidence score, low/high interval, macroeconomic index)
    valuation_confidence_matrix = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ==============================================================================
# 4. PROPERTIES & PROPERTY UNITS (ESTATEOS REAL ESTATE MODULE)
# ==============================================================================

class Property(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    parcel_number = Column(String(100), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    property_type = Column(String(50), nullable=False)  # residential, commercial, industrial, retail, office, land, apartment, villa, warehouse, multi_unit
    status = Column(String(50), default="available")  # available, occupied, maintenance, pending_sale, sold
    
    # Location & PostGIS Mapping
    address_line = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    geohash = Column(String(12), nullable=False, index=True)

    # Financials & Metrics
    purchase_price = Column(Numeric(15, 2), default=0.0)
    current_valuation = Column(Numeric(15, 2), default=0.0)
    rental_value = Column(Numeric(15, 2), default=0.0)
    
    # Specs
    area_sqft = Column(Float, nullable=False)
    bedrooms = Column(Integer, default=0)
    bathrooms = Column(Float, default=0.0)
    units_count = Column(Integer, default=1)
    year_built = Column(Integer, nullable=True)
    amenities = Column(JSON, default=list)  # list of strings
    images = Column(JSON, default=list)  # list of image URLs
    featured_image = Column(String(500), nullable=True)
    
    # Visual embedding for similarity matching
    interior_visual_embedding = Column(JSON, nullable=True)
    valuation_confidence_matrix = Column(JSON, default=dict)
    
    owner_name = Column(String(255), nullable=True)
    owner_contact = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="properties")
    units = relationship("PropertyUnit", back_populates="property", cascade="all, delete-orphan")
    leases = relationship("Lease", back_populates="property", cascade="all, delete-orphan")
    maintenance_tickets = relationship("MaintenanceTicket", back_populates="property", cascade="all, delete-orphan")

class PropertyUnit(Base):
    __tablename__ = "property_units"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_number = Column(String(50), nullable=False)
    floor = Column(Integer, default=1)
    area_sqft = Column(Float, nullable=False)
    bedrooms = Column(Integer, default=1)
    bathrooms = Column(Float, default=1.0)
    rental_price = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), default="vacant")  # vacant, occupied, maintenance
    amenities = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="units")

# ==============================================================================
# 5. CRM & LEADS MANAGEMENT (ZILLOW PREMIER AGENT + ENTERPRISE PIPELINE)
# ==============================================================================

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_type = Column(String(50), default="lead")  # tenant, buyer, seller, investor, vendor, lead
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    lifecycle_stage = Column(String(50), default="new_lead")
    address = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    leads = relationship("Lead", back_populates="contact", cascade="all, delete-orphan")
    interactions = relationship("CustomerInteraction", back_populates="contact", cascade="all, delete-orphan")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # 6-stage Kanban Pipeline
    stage = Column(String(50), default="new_lead")  # new_lead, contacted, qualified, site_visit, negotiation, converted, lost
    lead_score = Column(Float, default=50.0)  # AI lead score 0-100
    intent_vector = Column(JSON, default=dict)  # Extracted preferences & urgency
    
    budget_min = Column(Numeric(15, 2), default=0.0)
    budget_max = Column(Numeric(15, 2), default=0.0)
    preferred_location = Column(String(255), nullable=True)
    preferred_type = Column(String(50), nullable=True)
    source = Column(String(100), default="website")  # website, premier_agent, referral, walk_in
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contact = relationship("Contact", back_populates="leads")

class CustomerInteraction(Base):
    __tablename__ = "customer_interactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(50), default="call")  # call, email, whatsapp, meeting, note
    summary = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    contact = relationship("Contact", back_populates="interactions")

# ==============================================================================
# 6. LEASES & RENTAL MANAGEMENT
# ==============================================================================

class Lease(Base):
    __tablename__ = "leases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_id = Column(String(36), ForeignKey("property_units.id", ondelete="SET NULL"), nullable=True)
    tenant_contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    monthly_rent = Column(Numeric(15, 2), nullable=False)
    security_deposit = Column(Numeric(15, 2), default=0.0)
    payment_frequency = Column(String(20), default="monthly")
    escalation_rate_percent = Column(Float, default=5.0)  # e.g., 5% annual
    late_fee_amount = Column(Numeric(15, 2), default=500.0)
    
    status = Column(String(50), default="active")  # draft, active, pending_renewal, expired, terminated
    signature_status = Column(String(50), default="unsigned")  # unsigned, pending, signed
    agreement_pdf_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="leases")
    invoices = relationship("Invoice", back_populates="lease", cascade="all, delete-orphan")

# ==============================================================================
# 7. FINANCIAL MANAGEMENT & DOUBLE-ENTRY LEDGERS
# ==============================================================================

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    lease_id = Column(String(36), ForeignKey("leases.id", ondelete="SET NULL"), nullable=True)
    
    type = Column(String(50), nullable=False)  # rental_income, sales_income, property_expense, maintenance_expense, vendor_payment, security_deposit, commission
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="completed")  # pending, verified, completed, failed
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    lease_id = Column(String(36), ForeignKey("leases.id", ondelete="SET NULL"), nullable=True)
    contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    
    invoice_number = Column(String(100), nullable=False, index=True)
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    gst_amount = Column(Numeric(15, 2), default=0.0)  # GST calculation
    total_amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), default="sent")  # draft, sent, paid, overdue, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lease = relationship("Lease", back_populates="invoices")

# ==============================================================================
# 8. MAINTENANCE & FACILITY MANAGEMENT
# ==============================================================================

class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_id = Column(String(36), ForeignKey("property_units.id", ondelete="SET NULL"), nullable=True)
    requester_contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    assigned_vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="general")  # plumbing, electrical, hvac, structural, appliance, general
    priority = Column(String(50), default="medium")  # low, medium, high, urgent
    status = Column(String(50), default="open")  # open, in_progress, awaiting_approval, resolved, closed
    
    estimated_cost = Column(Numeric(15, 2), default=0.0)
    actual_cost = Column(Numeric(15, 2), default=0.0)
    sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    property = relationship("Property", back_populates="maintenance_tickets")
    work_orders = relationship("WorkOrder", back_populates="ticket", cascade="all, delete-orphan")

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_id = Column(String(36), ForeignKey("maintenance_tickets.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    
    work_order_number = Column(String(100), nullable=False)
    status = Column(String(50), default="issued")  # issued, acknowledged, in_progress, completed, verified
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    total_cost = Column(Numeric(15, 2), default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("MaintenanceTicket", back_populates="work_orders")

# ==============================================================================
# 9. SALES, TRANSACTIONS & DEALS
# ==============================================================================

class Deal(Base):
    __tablename__ = "deals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    buyer_contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    seller_contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    agent_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    stage = Column(String(50), default="inquiry")  # inquiry, offer_submitted, negotiation, under_contract, closed, lost
    offer_amount = Column(Numeric(15, 2), nullable=False)
    commission_rate = Column(Float, default=2.0)  # e.g., 2%
    commission_amount = Column(Numeric(15, 2), default=0.0)
    expected_close_date = Column(DateTime, nullable=True)
    closed_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==============================================================================
# 10. DOCUMENTS VAULT & OCR LEGAL INTELLIGENCE
# ==============================================================================

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    lease_id = Column(String(36), ForeignKey("leases.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), default="contract")  # lease_agreement, deed, inspection, invoice, tax, kyc, contract
    file_url = Column(String(500), nullable=False)
    file_format = Column(String(20), default="pdf")
    file_size_bytes = Column(Integer, default=0)
    ocr_extracted_text = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)  # extracted clauses, key dates, missing fields
    expiration_date = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==============================================================================
# 11. VENDORS & HUMAN WORKFORCE
# ==============================================================================

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    service_category = Column(String(100), default="general")  # hvac, plumbing, electrical, carpentry, roofing, cleaning, security, legal
    rating = Column(Float, default=4.5)
    status = Column(String(50), default="active")  # active, pending_verification, suspended
    gst_number = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department = Column(String(100), default="operations")  # sales, operations, maintenance, accounting, legal, executive
    position = Column(String(100), nullable=False)
    hire_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="active")

# ==============================================================================
# 12. MULTI-AGENT ORCHESTRATION & AGENT CONTROL CENTER
# ==============================================================================

class AIAgent(Base):
    __tablename__ = "ai_agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # management, property, sales, finance, maintenance, legal, operational
    status = Column(String(50), default="online")  # online, busy, standby
    total_invocations = Column(Integer, default=0)
    average_latency_ms = Column(Float, default=120.0)
    system_prompt = Column(Text, nullable=False)
    capabilities = Column(JSON, default=list)

class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_code = Column(String(100), nullable=False, index=True)
    task_type = Column(String(100), nullable=False)
    status = Column(String(50), default="completed")  # queued, executing, awaiting_approval, completed, failed
    input_payload = Column(JSON, default=dict)
    output_payload = Column(JSON, default=dict)
    execution_time_ms = Column(Float, default=150.0)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), nullable=True)
    action_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    details_json = Column(JSON, default=dict)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    requested_by_agent = Column(String(100), nullable=False)
    reviewed_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)

# ==============================================================================
# 13. WORKFLOW AUTOMATION ENGINE
# ==============================================================================

class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_event = Column(String(100), nullable=False)  # rent_overdue, leak_reported, new_lead, lease_expiring, new_property, invoice_uploaded, inspection_due
    is_active = Column(Boolean, default=True)
    nodes_json = Column(JSON, default=list)
    edges_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id = Column(String(36), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="completed")  # running, completed, failed
    trigger_payload = Column(JSON, default=dict)
    execution_log_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==============================================================================
# 14. DEVELOPER API PLATFORM & AUDIT LOGS
# ==============================================================================

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(20), nullable=False)  # e.g., "eos_live_..."
    key_hash = Column(String(255), nullable=False, index=True)
    role = Column(String(50), default="property_manager")
    rate_limit_per_minute = Column(Integer, default=120)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    target_url = Column(String(500), nullable=False)
    event_types = Column(JSON, default=list)  # ["property.created", "lease.signed", "payment.verified", "maintenance.ticket_created"]
    secret_token = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    agent_id = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)  # create, update, delete, execute, approve
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==============================================================================
# 15. ZILLOWCORE RESO INGESTION SANDBOX AUDIT
# ==============================================================================

class IngestionPipeline(Base):
    """
    Tracks self-healing RESO / MLS feed ingestion adapters (from PDF p.5-6).
    """
    __tablename__ = "ingestion_pipelines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    feed_name = Column(String(255), nullable=False)
    source_format = Column(String(50), default="RESO_Web_API")  # RESO_Web_API, RETS, Custom_JSON, CSV_Feed
    status = Column(String(50), default="healthy")  # healthy, anomaly_detected, auto_healing, verified
    anomaly_detected_at = Column(DateTime, nullable=True)
    active_adapter_version = Column(String(50), default="v1.0.0")
    adapter_wasm_binary_hash = Column(String(100), nullable=True)
    total_records_ingested = Column(Integer, default=0)
    last_sync_timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

