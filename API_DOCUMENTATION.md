# EstateOS AI / ZillowCore — API Documentation

**Base URL:** `http://localhost:8000/api/v1`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**OpenAPI Specification:** `http://localhost:8000/api/v1/openapi.json`  
**Authentication Header:** `Authorization: Bearer <JWT_TOKEN>` or `X-API-Key: <API_KEY>`

---

## 1. Authentication Endpoints

### `POST /auth/login`
- **Payload:** `{"email": "admin@estateos.ai", "password": "Admin@123"}`
- **Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "84c8a29a-...",
  "org_id": "d0f81a7b-...",
  "role": "super_admin",
  "full_name": "Vikramaditya Singhania",
  "email": "admin@estateos.ai"
}
```

### `POST /auth/register`
- **Payload:** `{"organization_name": "Apex Holdings", "full_name": "Rajesh Birla", "email": "rajesh@corp.in", "password": "Password123"}`

---

## 2. ZillowCore Core Engine APIs

### `POST /geospatial/route-intent` (NGQR Engine from PDF p.3-4)
- **Payload:**
```json
{
  "natural_language_query": "Find a luxury home in Northeast Bhopal under 2 Crore",
  "target_result_limit": 5
}
```
- **Response:**
```json
{
  "targeted_postgis_sql": "SELECT property_id, parcel_number, current_valuation_amount FROM property_master_ledger WHERE ST_DWithin(geo_location, ...) AND current_valuation_amount <= 20000000.00 LIMIT 5;",
  "query_vector_embedding": [0.012, -0.045, 0.089, ...],
  "optimized_execution_plan_hash": "0x4b9a82fe018a",
  "strict_price_ceiling": 20000000.0,
  "matched_properties": [
    {
      "id": "prop-bpl-001",
      "title": "Gulmohar Imperial Luxury Villa",
      "city": "Bhopal",
      "current_valuation": 18500000.0,
      "similarity_score": 0.942,
      "distance_km": 2.4,
      "composite_rank_score": 0.912
    }
  ],
  "explanation": "Evaluated spatial query intent for 'Find a luxury home in Northeast Bhopal under 2 Crore'. Parsed city scope: Bhopal, Price Ceiling: ₹20,000,000."
}
```

### `POST /valuation/calculate` (MVE Autonomous Zestimate from PDF p.4-5)
- **Payload:**
```json
{
  "area_sqft": 2200,
  "bedrooms": 3,
  "bathrooms": 3,
  "property_type": "apartment",
  "city": "mumbai",
  "amenities": ["Italian Marble", "Smart Home Automation"]
}
```
- **Response:**
```json
{
  "estimated_valuation": 44880000.0,
  "rental_estimate": 119700.0,
  "confidence_matrix": {
    "confidence_score": 0.94,
    "valuation_low": 40841000.0,
    "valuation_high": 48919000.0,
    "historical_price_trend_pct": 8.4,
    "satellite_neighborhood_score": 0.92,
    "macroeconomic_factor": 1.042,
    "explanation": "MVE Valuation Model v2.8 computed continuous asset valuation for apartment in Mumbai."
  },
  "comparables_count": 6,
  "calculation_timestamp": "2026-11-09T05:20:00Z"
}
```

### `POST /ingestion/test-feed` (Autonomous RESO Sandbox from PDF p.5-6)
- **Payload:**
```json
{
  "feed_name": "RESO_Central_India_MLS",
  "sample_payload": {
    "ListingKey": "PROP-BPL-9921",
    "CustomLocality": "Bhopal MP",
    "PriceInINR": 18500000,
    "TotalCarpetArea": 3850
  }
}
```
- **Response:**
```json
{
  "feed_name": "RESO_Central_India_MLS",
  "status": "self_healed_and_verified",
  "drifts_detected": ["Missing expected RESO standards: ['LivingArea', 'ListPrice']", "Novel non-standard field permutations: ['PriceInINR', 'TotalCarpetArea']"],
  "auto_generated_adapter_code": "// AUTO-GENERATED RESO ADAPTER BY ESTATEOS SANDBOX AGENT\n...",
  "wasm_binary_hash": "wasm32-wasi-e9182bf90a",
  "verification_score": 100.0,
  "is_live_deployed": true
}
```

---

## 3. Core Enterprise Domain APIs

- `GET /properties` & `POST /properties`: Complete property CRUD with geo-coordinates and filters.
- `GET /properties/export/csv`: Export all organization properties to CSV.
- `GET /crm/leads` & `PUT /crm/leads/{id}/stage`: 6-stage Kanban lead transitions.
- `GET /leases` & `POST /leases/{id}/renew` & `POST /leases/{id}/sign`: Full lease lifecycle.
- `GET /finance/invoices` & `PUT /finance/invoices/{id}/pay`: Settle invoices with 18% GST and double-entry recording.
- `GET /maintenance/tickets` & `POST /maintenance/tickets`: AI-triaged maintenance intake.
- `POST /command`: Central AI Command Center natural language execution.
- `GET /agents/registry` & `POST /agents/execute`: LangGraph multi-agent execution and task logs.
- `GET /reports/dashboard-metrics`: Live relational metrics (MRR, NOI, Occupancy %, Trends).

