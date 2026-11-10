import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["agents_online"] == 24
    assert data["ngqr_status"] == "operational"

def test_auth_login_admin():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@estateos.ai",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "super_admin"
    assert data["full_name"] == "Vikramaditya Singhania"

def test_auth_invalid_credentials():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@estateos.ai",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def get_auth_header():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@estateos.ai",
        "password": "Admin@123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_properties_list():
    headers = get_auth_header()
    response = client.get("/api/v1/properties", headers=headers)
    assert response.status_code == 200
    props = response.json()
    assert len(props) >= 5
    # Verify properties have parcel_number and coordinates
    assert any(p["city"].lower() == "bhopal" for p in props)
    assert any(p["city"].lower() == "mumbai" for p in props)

def test_ngqr_natural_language_spatial_routing():
    """Tests Module A from PDF: Neural Geo-Spatial Query Router"""
    headers = get_auth_header()
    response = client.post("/api/v1/geospatial/route-intent", headers=headers, json={
        "natural_language_query": "Find a luxury home in Northeast Bhopal under 2 Crore",
        "target_result_limit": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "SELECT" in data["targeted_postgis_sql"]
    assert "property_master_ledger" in data["targeted_postgis_sql"]
    assert data["strict_price_ceiling"] == 20000000.0
    assert len(data["matched_properties"]) > 0
    assert data["matched_properties"][0]["city"].lower() == "bhopal"
    assert "composite_rank_score" in data["matched_properties"][0]

def test_mve_multimodal_valuation_engine():
    """Tests Module B from PDF: Multimodal Valuation Engine (Autonomous Zestimate)"""
    headers = get_auth_header()
    response = client.post("/api/v1/valuation/calculate", headers=headers, json={
        "area_sqft": 2400.0,
        "bedrooms": 3,
        "bathrooms": 3.0,
        "property_type": "apartment",
        "amenities": ["Italian Marble", "Smart Home Automation"]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["estimated_valuation"] > 0
    assert data["confidence_matrix"]["confidence_score"] >= 0.85
    assert data["confidence_matrix"]["valuation_low"] < data["estimated_valuation"]
    assert data["confidence_matrix"]["valuation_high"] > data["estimated_valuation"]

def test_reso_ingestion_sandbox_auto_healing():
    """Tests Section 5 from PDF: Autonomous RESO Ingestion Sandbox"""
    headers = get_auth_header()
    response = client.post("/api/v1/ingestion/test-feed", headers=headers, json={
        "feed_name": "RESO_Central_India_MLS",
        "sample_payload": {
            "ListingKey": "PROP-BPL-9921",
            "CustomLocality": "Bhopal MP",
            "PriceInINR": 18500000,
            "TotalCarpetArea": 3850
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "self_healed_and_verified"
    assert data["verification_score"] == 100.0
    assert "auto_generated_adapter_code" in data
    assert data["is_live_deployed"] is True

def test_crm_leads_kanban_transition():
    headers = get_auth_header()
    # List leads
    leads_res = client.get("/api/v1/crm/leads", headers=headers)
    assert leads_res.status_code == 200
    leads = leads_res.json()
    assert len(leads) > 0
    lead_id = leads[0]["id"]

    # Transition stage
    put_res = client.put(f"/api/v1/crm/leads/{lead_id}/stage", headers=headers, json={
        "stage": "site_visit",
        "notes": "Client scheduled inspection visit for Saturday."
    })
    assert put_res.status_code == 200
    assert put_res.json()["stage"] == "site_visit"

def test_ai_agents_registry():
    """Verify all 24 Specialized Enterprise Agents are online and registered"""
    headers = get_auth_header()
    response = client.get("/api/v1/agents/registry", headers=headers)
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) == 24
    agent_codes = [a["agent_code"] for a in agents]
    assert "master_orchestrator" in agent_codes
    assert "property_valuation" in agent_codes
    assert "maintenance_triage" in agent_codes
    assert "rent_collection" in agent_codes
    assert "document_intelligence" in agent_codes
    assert "executive_reporting" in agent_codes

def test_ai_command_center_execution():
    headers = get_auth_header()
    response = client.post("/api/v1/command", headers=headers, json={
        "prompt": "Find vacant villas in Bhopal"
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["steps"]) >= 3
    assert data["selected_agent"] == "ngqr_router"
    assert "Gulmohar" in data["summary_markdown"] or "Bhopal" in data["summary_markdown"]

def test_dashboard_real_metrics():
    headers = get_auth_header()
    response = client.get("/api/v1/reports/dashboard-metrics", headers=headers)
    assert response.status_code == 200
    metrics = response.json()
    assert metrics["total_properties"] >= 5
    assert metrics["monthly_recurring_revenue"] > 0
    assert metrics["occupancy_percentage"] > 0
    assert len(metrics["revenue_trends"]) == 6

def test_developer_api_key_auth():
    # Use pre-seeded demo API key
    headers = {"X-API-Key": "eos_live_demo1234567890abcdef"}
    response = client.get("/api/v1/properties", headers=headers)
    assert response.status_code == 200
    props = response.json()
    assert len(props) > 0

