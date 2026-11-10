import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Organization, User, Property
from app.core.security import get_password_hash

client = TestClient(app)

def test_cross_tenant_isolation_enforcement():
    """
    Guarantees that a user from Organization B cannot view or modify
    records belonging to Organization A.
    """
    db = SessionLocal()
    test_id = uuid.uuid4().hex[:6]
    email_b = f"manager_{test_id}@competitor.com"
    try:
        # Create a second tenant organization with unique slug
        org_b = Organization(
            name=f"Competitor Real Estate Ltd {test_id}",
            slug=f"competitor-re-{test_id}",
            subscription_tier="enterprise"
        )
        db.add(org_b)
        db.flush()

        user_b = User(
            org_id=org_b.id,
            email=email_b,
            hashed_password=get_password_hash("Secret@123"),
            full_name="Rival Manager",
            role="property_manager"
        )
        db.add(user_b)

        # Property in Org B
        prop_b = Property(
            org_id=org_b.id,
            parcel_number=f"COMP-{test_id}",
            title="Competitor Secret Asset",
            property_type="office",
            city="Mumbai",
            state="Maharashtra",
            latitude=19.07,
            longitude=72.87,
            geohash="te7u10v",
            area_sqft=5000,
            address_line="Confidential Lane"
        )
        db.add(prop_b)
        db.commit()
        org_b_id = org_b.id
        prop_b_id = prop_b.id
    finally:
        db.close()

    # 1. Login as Org A (Apex Holdings)
    res_a = client.post("/api/v1/auth/login", json={
        "email": "admin@estateos.ai",
        "password": "Admin@123"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Org A lists properties -> must NOT see Competitor Secret Asset
    props_a = client.get("/api/v1/properties", headers=headers_a).json()
    assert not any(p["id"] == prop_b_id for p in props_a)

    # Org A tries to directly fetch Org B's property -> must return 404
    get_res = client.get(f"/api/v1/properties/{prop_b_id}", headers=headers_a)
    assert get_res.status_code == 404

    # 2. Login as Org B
    res_b = client.post("/api/v1/auth/login", json={
        "email": email_b,
        "password": "Secret@123"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Org B lists properties -> MUST see their own asset
    props_b = client.get("/api/v1/properties", headers=headers_b).json()
    assert any(p["id"] == prop_b_id for p in props_b)
    # Org B must NOT see Apex properties
    assert not any(p["title"] == "Gulmohar Imperial Luxury Villa" for p in props_b)

