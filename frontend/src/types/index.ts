export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  currency: string;
  tax_rate: number;
  settings: Record<string, any>;
}

export interface Property {
  id: string;
  org_id: string;
  parcel_number?: string;
  title: string;
  description?: string;
  property_type: string;
  status: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  geohash: string;
  purchase_price: number;
  current_valuation: number;
  rental_value: number;
  area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  units_count: number;
  year_built?: number;
  amenities: string[];
  images: string[];
  featured_image?: string;
  valuation_confidence_matrix?: {
    confidence_score: number;
    valuation_low: number;
    valuation_high: number;
    historical_price_trend_pct: number;
    satellite_neighborhood_score: number;
    macroeconomic_factor: number;
    explanation: string;
  };
  owner_name?: string;
  created_at: string;
}

export interface PropertyUnit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number;
  area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  rental_price: number;
  status: string;
  amenities: string[];
}

export interface Contact {
  id: string;
  org_id: string;
  contact_type: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  lifecycle_stage: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  org_id: string;
  contact_id: string;
  contact?: Contact;
  assigned_to_user_id?: string;
  stage: string;
  lead_score: number;
  intent_vector?: Record<string, any>;
  budget_min: number;
  budget_max: number;
  preferred_location?: string;
  preferred_type?: string;
  source: string;
  notes?: string;
  created_at: string;
}

export interface Lease {
  id: string;
  org_id: string;
  property_id: string;
  property?: Property;
  unit_id?: string;
  tenant_contact_id: string;
  tenant?: Contact;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  payment_frequency: string;
  escalation_rate_percent: number;
  late_fee_amount: number;
  status: string;
  signature_status: string;
  agreement_pdf_url?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  lease_id?: string;
  contact_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  org_id: string;
  property_id?: string;
  lease_id?: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  category: string;
  description?: string;
  reference_number?: string;
  is_verified: boolean;
}

export interface MaintenanceTicket {
  id: string;
  org_id: string;
  property_id: string;
  unit_id?: string;
  requester_contact_id?: string;
  assigned_vendor_id?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  estimated_cost: number;
  actual_cost: number;
  sla_hours: number;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  ticket_id: string;
  vendor_id?: string;
  work_order_number: string;
  status: string;
  scheduled_date?: string;
  total_cost: number;
  notes?: string;
}

export interface Deal {
  id: string;
  org_id: string;
  property_id: string;
  title: string;
  stage: string;
  offer_amount: number;
  commission_rate: number;
  commission_amount: number;
  expected_close_date?: string;
  notes?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  org_id: string;
  title: string;
  document_type: string;
  file_url: string;
  file_format: string;
  file_size_bytes: number;
  ocr_extracted_text?: string;
  metadata_json?: Record<string, any>;
  expiration_date?: string;
  is_verified: boolean;
  created_at: string;
}

export interface Vendor {
  id: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  service_category: string;
  rating: number;
  status: string;
  gst_number?: string;
}

export interface AIAgent {
  id: string;
  agent_code: string;
  name: string;
  category: string;
  status: string;
  total_invocations: number;
  average_latency_ms: number;
  capabilities: string[];
}

export interface AgentTask {
  id: string;
  agent_code: string;
  task_type: string;
  status: string;
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  execution_time_ms: number;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

export interface Approval {
  id: string;
  task_id?: string;
  action_type: string;
  title: string;
  description: string;
  details_json: Record<string, any>;
  status: string;
  requested_by_agent: string;
  created_at: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger_event: string;
  is_active: boolean;
  nodes_json: any[];
  edges_json: any[];
  created_at: string;
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  raw_key?: string;
  role: string;
  rate_limit_per_minute: number;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  target_url: string;
  event_types: string[];
  is_active: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  total_properties: number;
  occupied_properties: number;
  available_properties: number;
  vacant_units: number;
  total_tenants: number;
  active_leases: number;
  monthly_recurring_revenue: number;
  outstanding_rent: number;
  total_expenses: number;
  net_operating_income: number;
  occupancy_percentage: number;
  upcoming_lease_expirations: number;
  pending_maintenance_requests: number;
  sales_pipeline_value: number;
  revenue_trends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    noi: number;
  }>;
  property_performance: Array<{
    id: string;
    title: string;
    city: string;
    property_type: string;
    occupancy: string;
    monthly_income: number;
    current_valuation: number;
    cap_rate: string;
  }>;
  ai_insights: string[];
  currency: string;
}

export interface CommandResponse {
  query: string;
  intent: string;
  selected_agent: string;
  steps: Array<{
    step_number: number;
    agent: string;
    action: string;
    status: string;
    details: string;
  }>;
  result: Record<string, any>;
  summary_markdown: string;
  approval_required: boolean;
  approval_id?: string;
}

