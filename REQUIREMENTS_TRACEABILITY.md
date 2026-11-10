# EstateOS AI / ZillowCore — Requirements Traceability Matrix (RTM)

This document establishes a complete bi-directional mapping from the project specifications (Primary Source of Truth: `ENTERPRISE PRODUCT REQUIREMENTS DOCUMENT & TECHNICAL ARCHITECTURE` PDF + Master Build Prompt) to software modules, database entities, backend APIs, frontend interfaces, AI agents, test cases, and implementation status.

---

## 1. ZillowCore Core Engine Requirements (from PDF Specification)

| Req ID | Requirement Description | Software Module | Database Entities | Backend APIs | Frontend Screens | AI Agents | Test Cases | Status |
|---|---|---|---|---|---|---|---|---|
| **ZC-01** | High-Throughput Geo-Deterministic Engine (PostGIS, spatial index, geohash) | GeoSpatial Engine | `property_master_ledger`, `properties` | `POST /api/v1/geospatial/query`, `GET /api/v1/properties/spatial` | Geo Map View, Spatial Search Bar | Neural Geo-Spatial Query Router (NGQR) | `test_geospatial_bounding_box`, `test_geohash_lookup` | Planned |
| **ZC-02** | Multimodal Valuation Engine (MVE / Autonomous Zestimate) | Valuation Engine | `property_master_ledger`, `property_valuations` | `POST /api/v1/valuation/calculate`, `GET /api/v1/valuation/:id` | Property Valuation Modal, Asset Detail View | Property Valuation Agent (MVE) | `test_mve_valuation_confidence`, `test_mve_visual_embedding` | Planned |
| **ZC-03** | Autonomous RESO / Data Ingestion Sandbox & Self-Healing Pipeline | Ingestion Sandbox | `ingestion_pipelines`, `mls_data_feeds`, `adapter_audit_logs` | `POST /api/v1/ingestion/feed`, `POST /api/v1/ingestion/test-adapter` | Data Connectors Admin, Pipeline Monitor | RESO Data Ingestion Agent, Data Quality Agent | `test_reso_anomaly_detection`, `test_adapter_verification` | Planned |
| **ZC-04** | Neural Geo-Spatial Query Router (NGQR) natural language query parsing | Intent & Geo Router | `search_intent_logs`, `spatial_cache` | `POST /api/v1/geospatial/route-intent` | Conversational Map Explorer, AI Search Bar | NGQR Agent, Master Orchestrator | `test_ngqr_natural_language_spatial_parsing` | Planned |
| **ZC-05** | High-dimensional interior visual embeddings (1536-dim) & HNSW search | Vector Search Engine | `property_master_ledger` (`interior_visual_embedding`) | `POST /api/v1/properties/visual-search` | Visual Similarity Gallery, Property Card | Property Intelligence Agent | `test_vector_similarity_search` | Planned |
| **ZC-06** | Autonomous Lead Routing & Intent Matcher (Zillow Premier Agent model) | CRM & Matcher | `leads`, `agent_intent_vectors`, `lead_assignments` | `POST /api/v1/leads/route`, `GET /api/v1/leads/:id/match` | Premier Agent Lead Dashboard, Pipeline | Lead Qualification Agent, Sales Agent | `test_lead_intent_scoring_and_routing` | Planned |

---

## 2. Enterprise Application Modules (from Master Build Prompt)

| Req ID | Requirement Description | Software Module | Database Entities | Backend APIs | Frontend Screens | AI Agents | Test Cases | Status |
|---|---|---|---|---|---|---|---|---|
| **EAS-01** | Enterprise Command Center Dashboard (KPI cards, charts, filters) | Dashboard Module | All transactional tables, `analytics_cache` | `GET /api/v1/dashboard/metrics`, `GET /api/v1/dashboard/trends` | `/dashboard` (Executive Command Center) | Business Intelligence Agent, Executive Reporting Agent | `test_dashboard_metrics_aggregation` | Planned |
| **EAS-02** | Comprehensive Property & Unit Management (multi-types, media, amenities, CSV import) | Properties Module | `properties`, `property_units`, `property_amenities`, `property_media` | `GET/POST /api/v1/properties`, `POST /api/v1/properties/bulk-import` | `/properties`, `/properties/[id]`, `/units` | Property Intelligence Agent | `test_property_crud`, `test_property_bulk_import` | Planned |
| **EAS-03** | Multi-Persona CRM & 6-Stage Kanban Sales Pipeline | CRM Module | `contacts`, `leads`, `customer_interactions`, `tasks` | `GET/POST /api/v1/crm/contacts`, `GET/POST /api/v1/crm/leads`, `PUT /api/v1/crm/leads/:id/stage` | `/crm`, `/leads`, `/crm/contacts/[id]` | Lead Qualification Agent, Customer Communication Agent | `test_lead_kanban_stage_transition`, `test_crm_contact_timeline` | Planned |
| **EAS-04** | Lease and Rental Lifecycle Management (Agreements, renewals, e-signatures) | Lease Module | `leases`, `lease_agreements`, `security_deposits`, `rent_escalations` | `GET/POST /api/v1/leases`, `POST /api/v1/leases/:id/renew`, `POST /api/v1/leases/:id/sign` | `/leases`, `/leases/[id]`, `/leases/new` | Lease Intelligence Agent, Rent Collection Agent | `test_lease_creation_and_escalation`, `test_lease_signature_workflow` | Planned |
| **EAS-05** | Financial Management, Ledgers, Invoices & P&L Reporting (INR/USD, GST) | Finance Module | `financial_accounts`, `transactions`, `invoices`, `receipts`, `expenses` | `GET/POST /api/v1/finance/invoices`, `GET /api/v1/finance/reports/pnl` | `/finance`, `/finance/invoices`, `/finance/reports` | Financial Analysis Agent, Rent Collection Agent | `test_invoice_generation`, `test_double_entry_balance` | Planned |
| **EAS-06** | Maintenance & Facility Management (AI classification, SLA, work orders) | Maintenance Module | `maintenance_tickets`, `work_orders`, `equipment_inventory`, `sla_policies` | `GET/POST /api/v1/maintenance/tickets`, `POST /api/v1/maintenance/work-orders` | `/maintenance`, `/maintenance/tickets/[id]` | Maintenance Triage Agent, Vendor Management Agent | `test_maintenance_ticket_auto_classification` | Planned |
| **EAS-07** | Sales Deals, Booking & Commission Tracking | Sales Module | `deals`, `site_visits`, `offers`, `commissions` | `GET/POST /api/v1/sales/deals`, `POST /api/v1/sales/offers` | `/sales`, `/transactions` | Sales Agent, Property Matching Agent | `test_deal_closure_and_commission_split` | Planned |
| **EAS-08** | Document Vault with OCR Metadata Extraction & Expiry Tracking | Documents Module | `documents`, `document_versions`, `ocr_extractions` | `GET/POST /api/v1/documents`, `POST /api/v1/documents/upload` | `/documents`, `/documents/[id]` | Document Intelligence Agent, Compliance Monitoring Agent | `test_document_upload_and_metadata_extract` | Planned |
| **EAS-09** | Vendor & Employee Workforce Management | Staff & Vendor Module | `vendors`, `vendor_contracts`, `employees`, `departments` | `GET/POST /api/v1/vendors`, `GET/POST /api/v1/staff` | `/vendors`, `/settings/team` | Vendor Management Agent | `test_vendor_rating_and_verification` | Planned |
| **EAS-10** | Business Intelligence & Exportable Reports (PDF/Excel) | Reports Module | `scheduled_reports`, `report_templates` | `GET /api/v1/reports/export`, `POST /api/v1/reports/generate` | `/reports` | Executive Reporting Agent, Business Intelligence Agent | `test_report_generation_and_export` | Planned |

---

## 3. Multi-Agent AI Architecture & Automation

| Req ID | Requirement Description | Software Module | Database Entities | Backend APIs | Frontend Screens | AI Agents | Test Cases | Status |
|---|---|---|---|---|---|---|---|---|
| **AI-01** | LangGraph Multi-Agent Orchestrator (24 specialized domain agents) | Multi-Agent Orchestrator | `ai_agents`, `agent_tasks`, `agent_execution_logs` | `POST /api/v1/agents/execute`, `GET /api/v1/agents/registry` | `/agents` (Agent Control Center) | Master Orchestrator + 24 Specialized Agents | `test_agent_orchestrator_routing`, `test_agent_execution_logging` | Planned |
| **AI-02** | Omnipresent AI Command Center with streaming execution steps | Command Center Module | `chat_sessions`, `chat_messages`, `command_actions` | `POST /api/v1/ai/command`, `WSS /api/v1/ai/stream` | `/command-center`, Global Command Palette (`Ctrl+K`) | Master Orchestrator, All domain agents | `test_ai_command_intent_resolution`, `test_conversational_follow_ups` | Planned |
| **AI-03** | Human-in-the-Loop Approvals Queue for sensitive financial/legal tasks | Approvals Engine | `approvals`, `approval_actions` | `GET /api/v1/approvals/pending`, `POST /api/v1/approvals/:id/decide` | `/agents` (Approval Queue Drawer), `/dashboard` | Master Orchestrator, Workflow Automation Agent | `test_approval_gate_enforcement` | Planned |
| **AI-04** | Visual Workflow Automation Builder (Triggers, Conditions, Actions, Retries) | Automation Engine | `workflow_definitions`, `workflow_executions`, `workflow_triggers` | `GET/POST /api/v1/workflows`, `POST /api/v1/workflows/:id/trigger` | `/automations`, `/automations/builder` | Workflow Automation Agent | `test_workflow_trigger_and_action_pipeline` | Planned |

---

## 4. Platform Security, Developer Portal & Deployment

| Req ID | Requirement Description | Software Module | Database Entities | Backend APIs | Frontend Screens | AI Agents | Test Cases | Status |
|---|---|---|---|---|---|---|---|---|
| **SEC-01** | Multi-Tenancy & Data Isolation (Organization-scoped rows & schemas) | Auth & Security Core | `organizations`, `users`, `roles`, `organization_members` | `POST /api/v1/auth/login`, `POST /api/v1/auth/register` | `/login`, `/register`, `/settings/organization` | Security Monitoring Agent | `test_cross_tenant_isolation_violation` | Planned |
| **SEC-02** | 14-Role RBAC Authorization & Audit Trail | RBAC & Audit Module | `roles`, `permissions`, `audit_logs` | `GET /api/v1/audit/logs`, `GET /api/v1/auth/me` | `/settings/roles`, `/settings/audit-logs` | Security Monitoring Agent | `test_rbac_role_permissions` | Planned |
| **DEV-01** | Developer API Platform (API keys, webhooks, OpenAPI specification) | Dev Portal Module | `api_keys`, `webhooks`, `webhook_events`, `api_usage_metrics` | `GET/POST /api/v1/developer/keys`, `POST /api/v1/developer/webhooks` | `/developer-portal` | Master Orchestrator | `test_api_key_authentication_and_rate_limit` | Planned |
| **APP-01** | Tauri Desktop Application Shell (Windows installer & native packaging) | Desktop Shell | Local App State | Interacts with `/api/v1` | Tauri Desktop Window | N/A | `test_desktop_build_config` | Planned |
| **DEP-01** | Production Deployment & Docker Containerization | DevOps Engine | Seed script, migrations | `GET /api/v1/health` | Public Web App URL | N/A | `test_healthcheck_endpoint` | Planned |

