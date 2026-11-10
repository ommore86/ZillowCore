from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ==============================================================================
# AUTH & USER SCHEMAS
# ==============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    org_id: str
    role: str
    full_name: str
    email: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    org_id: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    organization_name: str
    full_name: str
    email: str
    password: str
    role: Optional[str] = "org_owner"
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    org_id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# ORGANIZATION SCHEMAS
# ==============================================================================

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    subscription_tier: str
    currency: str
    tax_rate: float
    settings: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    tax_rate: Optional[float] = None
    settings: Optional[Dict[str, Any]] = None

# ==============================================================================
# ZILLOWCORE PROTOCOL SCHEMAS (NGQR, MVE, RESO)
# ==============================================================================

class SpatialIntentRequest(BaseModel):
    """Matches Protobuf on page 4 of the PRD"""
    natural_language_query: str
    current_bounding_box_geojson: Optional[str] = None
    target_result_limit: int = 10

class SpatialQueryResolution(BaseModel):
    """Matches Protobuf on page 4 of the PRD"""
    targeted_postgis_sql: str
    query_vector_embedding: List[float] = []
    optimized_execution_plan_hash: str
    strict_price_ceiling: float
    matched_properties: List[Dict[str, Any]] = []
    explanation: Optional[str] = None

class ValuationRequest(BaseModel):
    property_id: Optional[str] = None
    address_or_title: Optional[str] = None
    area_sqft: float
    bedrooms: int = 2
    bathrooms: float = 2.0
    property_type: str = "apartment"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: List[str] = []
    interior_features: Optional[Dict[str, Any]] = None

class ValuationConfidenceMatrix(BaseModel):
    confidence_score: float  # e.g. 0.94 (94%)
    valuation_low: float
    valuation_high: float
    historical_price_trend_pct: float
    satellite_neighborhood_score: float
    macroeconomic_factor: float
    explanation: str

class ValuationResponse(BaseModel):
    property_id: Optional[str] = None
    estimated_valuation: float
    rental_estimate: float
    confidence_matrix: ValuationConfidenceMatrix
    comparables_count: int
    calculation_timestamp: datetime

# RESO Ingestion Schemas
class RESOFeedValidationRequest(BaseModel):
    feed_name: str
    sample_payload: Dict[str, Any]

class RESOAnomalyReport(BaseModel):
    feed_name: str
    status: str
    drifts_detected: List[str]
    auto_generated_adapter_code: str
    verification_score: float
    is_live_deployed: bool

# ==============================================================================
# PROPERTY & UNIT SCHEMAS
# ==============================================================================

class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: str = "apartment"
    status: str = "available"
    address_line: str
    city: str
    state: str
    country: str = "India"
    postal_code: Optional[str] = None
    latitude: float
    longitude: float
    purchase_price: float = 0.0
    current_valuation: float = 0.0
    rental_value: float = 0.0
    area_sqft: float
    bedrooms: int = 0
    bathrooms: float = 0.0
    units_count: int = 1
    year_built: Optional[int] = None
    amenities: List[str] = []
    images: List[str] = []
    featured_image: Optional[str] = None
    parcel_number: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    purchase_price: Optional[float] = None
    current_valuation: Optional[float] = None
    rental_value: Optional[float] = None
    area_sqft: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    units_count: Optional[int] = None
    year_built: Optional[int] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    featured_image: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: str
    org_id: str
    geohash: str
    valuation_confidence_matrix: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PropertyUnitCreate(BaseModel):
    unit_number: str
    floor: int = 1
    area_sqft: float
    bedrooms: int = 1
    bathrooms: float = 1.0
    rental_price: float
    status: str = "vacant"
    amenities: List[str] = []

class PropertyUnitResponse(PropertyUnitCreate):
    id: str
    org_id: str
    property_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# CRM & LEADS SCHEMAS
# ==============================================================================

class ContactCreate(BaseModel):
    contact_type: str = "lead"
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    lifecycle_stage: str = "new_lead"
    address: Optional[str] = None
    notes: Optional[str] = None

class ContactResponse(ContactCreate):
    id: str
    org_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadCreate(BaseModel):
    contact_id: str
    assigned_to_user_id: Optional[str] = None
    stage: str = "new_lead"
    budget_min: float = 0.0
    budget_max: float = 0.0
    preferred_location: Optional[str] = None
    preferred_type: Optional[str] = None
    source: str = "website"
    notes: Optional[str] = None

class LeadStageUpdate(BaseModel):
    stage: str
    notes: Optional[str] = None

class LeadResponse(BaseModel):
    id: str
    org_id: str
    contact_id: str
    contact: Optional[ContactResponse] = None
    assigned_to_user_id: Optional[str] = None
    stage: str
    lead_score: float
    intent_vector: Dict[str, Any]
    budget_min: float
    budget_max: float
    preferred_location: Optional[str] = None
    preferred_type: Optional[str] = None
    source: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# LEASE SCHEMAS
# ==============================================================================

class LeaseCreate(BaseModel):
    property_id: str
    unit_id: Optional[str] = None
    tenant_contact_id: str
    start_date: datetime
    end_date: datetime
    monthly_rent: float
    security_deposit: float = 0.0
    payment_frequency: str = "monthly"
    escalation_rate_percent: float = 5.0
    late_fee_amount: float = 500.0

class LeaseResponse(LeaseCreate):
    id: str
    org_id: str
    status: str
    signature_status: str
    agreement_pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# FINANCE & INVOICE SCHEMAS
# ==============================================================================

class FinancialTransactionCreate(BaseModel):
    property_id: Optional[str] = None
    lease_id: Optional[str] = None
    type: str  # rental_income, sales_income, property_expense, maintenance_expense, vendor_payment, security_deposit, commission
    amount: float
    currency: str = "INR"
    status: str = "completed"
    category: str
    description: Optional[str] = None
    reference_number: Optional[str] = None

class FinancialTransactionResponse(FinancialTransactionCreate):
    id: str
    org_id: str
    date: datetime
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    lease_id: Optional[str] = None
    contact_id: Optional[str] = None
    invoice_number: str
    due_date: datetime
    amount: float
    gst_amount: float = 0.0
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    org_id: str
    lease_id: Optional[str] = None
    contact_id: Optional[str] = None
    invoice_number: str
    issue_date: datetime
    due_date: datetime
    amount: float
    gst_amount: float
    total_amount: float
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# MAINTENANCE SCHEMAS
# ==============================================================================

class MaintenanceTicketCreate(BaseModel):
    property_id: str
    unit_id: Optional[str] = None
    requester_contact_id: Optional[str] = None
    title: str
    description: str
    category: Optional[str] = "general"
    priority: Optional[str] = "medium"

class MaintenanceTicketResponse(MaintenanceTicketCreate):
    id: str
    org_id: str
    assigned_vendor_id: Optional[str] = None
    status: str
    estimated_cost: float
    actual_cost: float
    sla_hours: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkOrderCreate(BaseModel):
    ticket_id: str
    vendor_id: Optional[str] = None
    work_order_number: str
    scheduled_date: Optional[datetime] = None
    total_cost: float = 0.0
    notes: Optional[str] = None

class WorkOrderResponse(WorkOrderCreate):
    id: str
    org_id: str
    status: str
    completed_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# SALES & DEALS SCHEMAS
# ==============================================================================

class DealCreate(BaseModel):
    property_id: str
    buyer_contact_id: Optional[str] = None
    seller_contact_id: Optional[str] = None
    agent_user_id: Optional[str] = None
    title: str
    stage: str = "inquiry"
    offer_amount: float
    commission_rate: float = 2.0
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = None

class DealResponse(DealCreate):
    id: str
    org_id: str
    commission_amount: float
    closed_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# DOCUMENTS VAULT & OCR SCHEMAS
# ==============================================================================

class DocumentCreate(BaseModel):
    property_id: Optional[str] = None
    lease_id: Optional[str] = None
    title: str
    document_type: str = "contract"
    file_url: str
    file_format: str = "pdf"
    file_size_bytes: int = 0
    ocr_extracted_text: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    expiration_date: Optional[datetime] = None

class DocumentResponse(DocumentCreate):
    id: str
    org_id: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# VENDOR & STAFF SCHEMAS
# ==============================================================================

class VendorCreate(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_category: str = "general"
    rating: float = 4.5
    gst_number: Optional[str] = None

class VendorResponse(VendorCreate):
    id: str
    org_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# AI AGENT & WORKFLOW SCHEMAS
# ==============================================================================

class AIAgentResponse(BaseModel):
    id: str
    agent_code: str
    name: str
    category: str
    status: str
    total_invocations: int
    average_latency_ms: float
    capabilities: List[str]

    class Config:
        from_attributes = True

class AgentExecutionRequest(BaseModel):
    agent_code: str
    task_type: str
    input_payload: Dict[str, Any]
    require_approval: bool = False

class AgentTaskResponse(BaseModel):
    id: str
    agent_code: str
    task_type: str
    status: str
    input_payload: Dict[str, Any]
    output_payload: Dict[str, Any]
    execution_time_ms: float
    tokens_used: int
    cost_usd: float
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalDecisionRequest(BaseModel):
    decision: str  # approved or rejected
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    org_id: str
    task_id: Optional[str] = None
    action_type: str
    title: str
    description: str
    details_json: Dict[str, Any]
    status: str
    requested_by_agent: str
    created_at: datetime
    decided_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_event: str
    nodes_json: List[Dict[str, Any]]
    edges_json: List[Dict[str, Any]]

class WorkflowResponse(WorkflowCreate):
    id: str
    org_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# AI COMMAND CENTER
# ==============================================================================

class CommandRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None

class CommandStep(BaseModel):
    step_number: int
    agent: str
    action: str
    status: str
    details: str

class CommandResponse(BaseModel):
    query: str
    intent: str
    selected_agent: str
    steps: List[CommandStep]
    result: Dict[str, Any]
    summary_markdown: str
    approval_required: bool = False
    approval_id: Optional[str] = None

# ==============================================================================
# DEVELOPER API & WEBHOOK SCHEMAS
# ==============================================================================

class APIKeyCreate(BaseModel):
    name: str
    role: Optional[str] = "property_manager"
    rate_limit_per_minute: Optional[int] = 120

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    raw_key: Optional[str] = None  # only returned on creation
    role: str
    rate_limit_per_minute: int
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WebhookCreate(BaseModel):
    target_url: str
    event_types: List[str]
    secret_token: Optional[str] = None

class WebhookResponse(BaseModel):
    id: str
    target_url: str
    event_types: List[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

