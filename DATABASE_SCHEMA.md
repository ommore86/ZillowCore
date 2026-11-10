# EstateOS AI / ZillowCore — Database Schema Specification

## 1. Primary Structural Ledger (`property_master_ledger` from PDF p.5)

```sql
CREATE TABLE property_master_ledger (
    property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_number VARCHAR(100) UNIQUE NOT NULL,
    geo_location GEOMETRY(Point, 4326) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geohash VARCHAR(12) NOT NULL,
    structural_attributes JSONB NOT NULL, -- beds, baths, area, year_built
    interior_visual_embedding VECTOR(1536), -- interior computer vision parsing
    current_valuation_amount NUMERIC(15, 2) NOT NULL,
    valuation_confidence_matrix JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_spatial ON property_master_ledger USING GIST (geo_location);
CREATE INDEX idx_property_vision ON property_master_ledger USING hnsw (interior_visual_embedding vector_cosine_ops);
```

---

## 2. Relational Entity Relationship Diagram

```
[organizations] (id, name, slug, currency, tax_rate)
       │
       ├──< [users] (id, org_id, email, hashed_password, role, phone)
       ├──< [properties] (id, org_id, parcel_number, title, property_type, price, valuation, lat, lon)
       │         │
       │         ├──< [property_units] (id, property_id, unit_number, rental_price, status)
       │         ├──< [leases] (id, property_id, tenant_contact_id, start_date, end_date, rent)
       │         │        └──< [invoices] (id, lease_id, invoice_number, total_amount, status)
       │         ├──< [maintenance_tickets] (id, property_id, category, priority, status)
       │         │        └──< [work_orders] (id, ticket_id, vendor_id, total_cost)
       │         └──< [deals] (id, property_id, buyer_contact_id, offer_amount, stage)
       │
       ├──< [contacts] (id, org_id, contact_type, full_name, email, phone)
       │         └──< [leads] (id, contact_id, stage, lead_score, intent_vector)
       │
       ├──< [financial_transactions] (id, org_id, type, amount, status, date, is_verified)
       ├──< [vendors] (id, org_id, company_name, service_category, rating, gst_number)
       ├──< [documents] (id, org_id, title, document_type, ocr_extracted_text, metadata_json)
       ├──< [workflow_definitions] (id, org_id, name, trigger_event, nodes_json, edges_json)
       ├──< [ai_agents] (id, agent_code, name, category, status, average_latency_ms)
       ├──< [agent_tasks] (id, org_id, agent_code, task_type, status, execution_time_ms, tokens_used)
       ├──< [approvals] (id, org_id, action_type, title, status, requested_by_agent)
       ├──< [api_keys] (id, org_id, name, key_prefix, key_hash, rate_limit_per_minute)
       ├──< [webhooks] (id, org_id, target_url, event_types, is_active)
       └──< [audit_logs] (id, org_id, action, resource_type, resource_id, timestamp)
```

---

## 3. Data Integrity & Indexing Strategy
- **Primary Keys:** UUID v4 across all tables.
- **Tenant Scoping:** Compound indexes on `(org_id, created_at)` and `(org_id, status)`.
- **Spatial Indexing:** GIST on `geo_location` and B-Tree on `geohash` for sub-50ms bounding-box evaluation.
- **Vector Search:** HNSW indexing on 1536-dimensional interior visual vectors.
- **Auditing:** Comprehensive append-only ledger in `audit_logs`.

