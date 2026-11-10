import hashlib
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    Organization, User, Property, PropertyMasterLedger, PropertyUnit,
    Contact, Lead, CustomerInteraction, Lease, FinancialTransaction, Invoice,
    MaintenanceTicket, WorkOrder, Deal, Document, Vendor, Employee,
    WorkflowDefinition, APIKey, Webhook, IngestionPipeline
)
from app.services.ai.orchestrator import MultiAgentOrchestrator
from app.services.ai.ngqr import generate_pseudo_embedding

def seed_database(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # Check if already seeded
    existing_org = db.query(Organization).filter(Organization.slug == "apex-holdings").first()
    if existing_org:
        print("Database already contains seed data.")
        return existing_org.id

    print("Seeding Enterprise Real Estate Operating System database...")

    # 1. Organization
    org = Organization(
        name="Apex Real Estate Holdings Pvt Ltd",
        slug="apex-holdings",
        domain="apexholdings.estateos.ai",
        subscription_tier="enterprise",
        currency="INR",
        tax_rate=18.0,
        settings={"timezone": "Asia/Kolkata", "date_format": "DD/MM/YYYY", "reporting_cycle": "monthly"}
    )
    db.add(org)
    db.flush()
    org_id = org.id

    # 2. Users (14 Roles Coverage & Demo Accounts)
    password_hash = get_password_hash("Admin@123")
    
    users_to_create = [
        {"email": "admin@estateos.ai", "name": "Vikramaditya Singhania", "role": "super_admin"},
        {"email": "owner@estateos.ai", "name": "Rajeshwari Birla", "role": "org_owner"},
        {"email": "manager@estateos.ai", "name": "Arjun Kapoor", "role": "property_manager"},
        {"email": "agent@estateos.ai", "name": "Pooja Sharma", "role": "real_estate_agent"},
        {"email": "finance@estateos.ai", "name": "Rohan Mehra", "role": "accountant"},
        {"email": "facility@estateos.ai", "name": "Deepak Verma", "role": "facility_manager"},
        {"email": "legal@estateos.ai", "name": "Ananya Sen", "role": "legal_officer"},
        {"email": "tenant@estateos.ai", "name": "Siddharth Roy", "role": "tenant"},
        {"email": "investor@estateos.ai", "name": "Kunal Shah", "role": "investor"},
        {"email": "analyst@estateos.ai", "name": "Neha Gupta", "role": "readonly_analyst"},
    ]

    created_users = {}
    for u in users_to_create:
        user_obj = User(
            org_id=org_id,
            email=u["email"],
            hashed_password=password_hash,
            full_name=u["name"],
            role=u["role"],
            phone="+91 98200 12345",
            is_active=True
        )
        db.add(user_obj)
        created_users[u["email"]] = user_obj
    db.flush()

    # 3. Vendors
    vendors_data = [
        {"name": "Apex Precision HVAC Solutions", "contact": "Ramesh Kumar", "cat": "hvac", "rating": 4.9, "phone": "+91 98111 22334"},
        {"name": "BlueLine Plumbing & Drainage", "contact": "Suresh Patel", "cat": "plumbing", "rating": 4.8, "phone": "+91 98222 33445"},
        {"name": "Voltaic Electrical Contractors", "contact": "Manoj Tiwari", "cat": "electrical", "rating": 4.7, "phone": "+91 98333 44556"},
        {"name": "UrbanShield Security Services", "contact": "Captain Rawat", "cat": "security", "rating": 4.9, "phone": "+91 98444 55667"},
        {"name": "EverClean Facility Management", "contact": "Priya Nair", "cat": "cleaning", "rating": 4.6, "phone": "+91 98555 66778"},
    ]
    created_vendors = []
    for v in vendors_data:
        vendor_obj = Vendor(
            org_id=org_id,
            company_name=v["name"],
            contact_name=v["contact"],
            service_category=v["cat"],
            rating=v["rating"],
            phone=v["phone"],
            email=f"contact@{v['cat']}-contractors.in",
            gst_number=f"27AABCU{v['rating']*100:.0f}Z1Z5"
        )
        db.add(vendor_obj)
        created_vendors.append(vendor_obj)
    db.flush()

    # 4. Properties & Property Master Ledger (PDF requirement: Bhopal, Mumbai, Delhi, Bengaluru)
    properties_data = [
        {
            "title": "Gulmohar Imperial Luxury Villa",
            "parcel_number": "IN-MP-BPL-2026-0041",
            "desc": "Grand 4BHK architectural masterpiece in Northeast Bhopal featuring mid-century style kitchen spaces, Italian marble, and lush landscaped garden.",
            "type": "villa",
            "city": "Bhopal",
            "state": "Madhya Pradesh",
            "lat": 23.2845,
            "lon": 77.4412,
            "geohash": "tsj02n1",
            "price": 18500000.0,
            "rent": 65000.0,
            "area": 3850.0,
            "beds": 4,
            "baths": 4.5,
            "amenities": ["Italian Marble", "Mid-Century Kitchen", "Private Garden", "Solar Array", "Security Guard"],
            "image": "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80"
        },
        {
            "title": "The Skyview Residences - BKC",
            "parcel_number": "IN-MH-MUM-2026-0812",
            "desc": "Ultra-luxury high-rise apartment in Bandra Kurla Complex with panoramic skyline views, smart home automation, and floor-to-ceiling glass.",
            "type": "apartment",
            "city": "Mumbai",
            "state": "Maharashtra",
            "lat": 19.0657,
            "lon": 72.8683,
            "geohash": "te7u10v",
            "price": 42500000.0,
            "rent": 145000.0,
            "area": 2200.0,
            "beds": 3,
            "baths": 3.0,
            "amenities": ["Smart Home Automation", "Infinity Pool", "Concierge", "Clubhouse", "Underground Parking"],
            "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
        },
        {
            "title": "CyberPark Tech Center - Tower A",
            "parcel_number": "IN-KA-BLR-2026-1190",
            "desc": "Grade-A LEED Platinum certified commercial tech office building in Whitefield with fiber connectivity, cafeteria, and 300 car parks.",
            "type": "office",
            "city": "Bengaluru",
            "state": "Karnataka",
            "lat": 12.9698,
            "lon": 77.7499,
            "geohash": "tdr1xyt",
            "price": 145000000.0,
            "rent": 850000.0,
            "area": 18500.0,
            "beds": 0,
            "baths": 12.0,
            "amenities": ["High-Speed Elevators", "100% Power Backup", "LEED Platinum", "Cafeteria", "EV Charging"],
            "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
        },
        {
            "title": "Golf Course Greens Penthouse",
            "parcel_number": "IN-HR-GGN-2026-0422",
            "desc": "Exclusive triplex penthouse overlooking DLF Golf Course in Gurugram, Delhi NCR with heated plunge pool and private elevator.",
            "type": "apartment",
            "city": "Delhi NCR",
            "state": "Haryana",
            "lat": 28.4595,
            "lon": 77.0266,
            "geohash": "ttnfudc",
            "price": 75000000.0,
            "rent": 280000.0,
            "area": 5600.0,
            "beds": 5,
            "baths": 6.0,
            "amenities": ["Private Elevator", "Heated Plunge Pool", "Wine Cellar", "Terrace Garden", "Golf Course View"],
            "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
        },
        {
            "title": "Apex Logistics & Cold Storage Hub",
            "parcel_number": "IN-MH-PUN-2026-0210",
            "desc": "Modern pre-engineered warehouse and cold chain storage facility located strategically along the Mumbai-Pune Expressway.",
            "type": "warehouse",
            "city": "Pune",
            "state": "Maharashtra",
            "lat": 18.7512,
            "lon": 73.6892,
            "geohash": "tekd18z",
            "price": 92000000.0,
            "rent": 620000.0,
            "area": 42000.0,
            "beds": 0,
            "baths": 4.0,
            "amenities": ["Dock Levelers", "Cold Storage", "24/7 Security", "Heavy Vehicle Turning Radius", "Fire Sprinklers"],
            "image": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
        },
        {
            "title": "Bhopal Smart City Commercial Retail Arcade",
            "parcel_number": "IN-MP-BPL-2026-0099",
            "desc": "Prime high-street retail showroom with high footfall frontage in TT Nagar, Bhopal.",
            "type": "retail",
            "city": "Bhopal",
            "state": "Madhya Pradesh",
            "lat": 23.2355,
            "lon": 77.4012,
            "geohash": "tsj00p4",
            "price": 28000000.0,
            "rent": 135000.0,
            "area": 3200.0,
            "beds": 0,
            "baths": 2.0,
            "amenities": ["Glass Frontage", "Heavy Footfall", "Central Air Conditioning", "Dedicated Parking"],
            "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
        }
    ]

    created_props = []
    for p in properties_data:
        # Generate 1536-dim embedding
        desc_full = f"{p['title']} {p['desc']} {' '.join(p['amenities'])}"
        visual_emb = generate_pseudo_embedding(desc_full, dim=1536)

        conf_matrix = {
            "confidence_score": 0.94,
            "valuation_low": round(p["price"] * 0.93, -3),
            "valuation_high": round(p["price"] * 1.07, -3),
            "historical_price_trend_pct": 7.8,
            "satellite_neighborhood_score": 0.91,
            "macroeconomic_factor": 1.042,
            "explanation": f"Continuous multimodal valuation for {p['type']} in {p['city']} verified by MVE engine."
        }

        prop_obj = Property(
            org_id=org_id,
            parcel_number=p["parcel_number"],
            title=p["title"],
            description=p["desc"],
            property_type=p["type"],
            status="available" if len(created_props) % 2 == 0 else "occupied",
            address_line=f"Asset {p['parcel_number'].split('-')[-1]}, Prime Corridor",
            city=p["city"],
            state=p["state"],
            country="India",
            postal_code="400051",
            latitude=p["lat"],
            longitude=p["lon"],
            geohash=p["geohash"],
            purchase_price=p["price"] * 0.88,
            current_valuation=p["price"],
            rental_value=p["rent"],
            area_sqft=p["area"],
            bedrooms=p["beds"],
            bathrooms=p["baths"],
            units_count=4 if p["type"] in ("apartment", "office") else 1,
            amenities=p["amenities"],
            images=[p["image"]],
            featured_image=p["image"],
            interior_visual_embedding=visual_emb[:32],  # preview in json
            valuation_confidence_matrix=conf_matrix,
            owner_name="Apex Real Estate Holdings Pvt Ltd"
        )
        db.add(prop_obj)
        db.flush()
        created_props.append(prop_obj)

        # PDF Requirement: Populate property_master_ledger
        master_ledger = PropertyMasterLedger(
            property_id=prop_obj.id,
            parcel_number=p["parcel_number"],
            geo_location={"type": "Point", "coordinates": [p["lon"], p["lat"]]},
            latitude=p["lat"],
            longitude=p["lon"],
            geohash=p["geohash"],
            structural_attributes={
                "bedrooms": p["beds"],
                "bathrooms": p["baths"],
                "area_sqft": p["area"],
                "property_type": p["type"]
            },
            interior_visual_embedding=visual_emb[:32],
            current_valuation_amount=p["price"],
            valuation_confidence_matrix=conf_matrix
        )
        db.add(master_ledger)

        # Property Units
        for u_num in range(1, prop_obj.units_count + 1):
            unit = PropertyUnit(
                org_id=org_id,
                property_id=prop_obj.id,
                unit_number=f"Unit-{100 + u_num}",
                floor=1,
                area_sqft=round(p["area"] / prop_obj.units_count, 1),
                bedrooms=max(1, p["beds"]),
                bathrooms=max(1.0, p["baths"]),
                rental_price=round(p["rent"] / prop_obj.units_count, 2),
                status="occupied" if u_num == 1 else "vacant"
            )
            db.add(unit)

    db.flush()

    # 5. CRM Contacts & Leads (Kanban coverage)
    contacts_data = [
        {"name": "Gaurav Sen", "email": "gaurav.sen@example.com", "phone": "+91 99001 11222", "type": "buyer"},
        {"name": "Simran Kaur", "email": "simran.kaur@example.com", "phone": "+91 99002 22333", "type": "tenant"},
        {"name": "Vivek Oberoi", "email": "vivek.o@investors.in", "phone": "+91 99003 33444", "type": "investor"},
        {"name": "Meera Deora", "email": "meera.d@fintech.co", "phone": "+91 99004 44555", "type": "lead"},
        {"name": "Aditya Roy", "email": "aditya.roy@example.com", "phone": "+91 99005 55666", "type": "tenant"}
    ]
    created_contacts = []
    for c in contacts_data:
        cnt = Contact(
            org_id=org_id,
            contact_type=c["type"],
            full_name=c["name"],
            email=c["email"],
            phone=c["phone"],
            company="Global Ventures Inc.",
            notes="Interested in prime city-center assets."
        )
        db.add(cnt)
        db.flush()
        created_contacts.append(cnt)

        # Create Leads for Kanban Pipeline
        stages = ["new_lead", "contacted", "qualified", "site_visit", "negotiation", "converted"]
        stage = stages[len(created_contacts) % len(stages)]
        lead = Lead(
            org_id=org_id,
            contact_id=cnt.id,
            stage=stage,
            lead_score=85.0 if stage in ("site_visit", "negotiation") else 60.0,
            budget_min=15000000.0,
            budget_max=45000000.0,
            preferred_location="Mumbai / Bhopal",
            preferred_type="apartment",
            notes=f"Active inquiry in {stage.replace('_', ' ').title()} stage."
        )
        db.add(lead)

    db.flush()

    # 6. Leases & Invoices
    lease1 = Lease(
        org_id=org_id,
        property_id=created_props[1].id,
        tenant_contact_id=created_contacts[1].id,
        start_date=datetime.utcnow() - timedelta(days=90),
        end_date=datetime.utcnow() + timedelta(days=275),
        monthly_rent=created_props[1].rental_value,
        security_deposit=created_props[1].rental_value * 3.0,
        status="active",
        signature_status="signed",
        agreement_pdf_url="https://estateos.ai/docs/lease-skyview-signed.pdf"
    )
    db.add(lease1)
    db.flush()

    # Invoices
    inv1 = Invoice(
        org_id=org_id,
        lease_id=lease1.id,
        contact_id=created_contacts[1].id,
        invoice_number="INV-2026-00412",
        due_date=datetime.utcnow() + timedelta(days=5),
        amount=float(lease1.monthly_rent),
        gst_amount=float(lease1.monthly_rent) * 0.18,
        total_amount=float(lease1.monthly_rent) * 1.18,
        status="sent",
        notes="Monthly rental invoice with 18% GST"
    )
    inv2 = Invoice(
        org_id=org_id,
        lease_id=lease1.id,
        contact_id=created_contacts[1].id,
        invoice_number="INV-2026-00388",
        due_date=datetime.utcnow() - timedelta(days=25),
        amount=float(lease1.monthly_rent),
        gst_amount=float(lease1.monthly_rent) * 0.18,
        total_amount=float(lease1.monthly_rent) * 1.18,
        status="paid",
        notes="Settled via Razorpay Bank Transfer"
    )
    db.add_all([inv1, inv2])

    # 7. Financial Transactions
    tx1 = FinancialTransaction(
        org_id=org_id,
        property_id=created_props[1].id,
        lease_id=lease1.id,
        type="rental_income",
        amount=float(inv2.total_amount),
        currency="INR",
        status="completed",
        category="Rental Revenue",
        description="Lease settlement for Unit 101 BKC",
        reference_number="TXN-RZP-992182"
    )
    tx2 = FinancialTransaction(
        org_id=org_id,
        property_id=created_props[0].id,
        type="property_expense",
        amount=42500.0,
        currency="INR",
        status="completed",
        category="Preventive Maintenance",
        description="Semi-annual HVAC servicing and filter change",
        reference_number="TXN-VND-441021"
    )
    db.add_all([tx1, tx2])

    # 8. Maintenance Tickets & Work Orders
    tkt = MaintenanceTicket(
        org_id=org_id,
        property_id=created_props[0].id,
        title="Kitchen under-sink water leakage",
        description="Slow drip identified beneath main sink basin in mid-century kitchen layout.",
        category="plumbing",
        priority="high",
        status="in_progress",
        estimated_cost=3500.0,
        sla_hours=24,
        assigned_vendor_id=created_vendors[1].id
    )
    db.add(tkt)
    db.flush()

    work_order = WorkOrder(
        org_id=org_id,
        ticket_id=tkt.id,
        vendor_id=created_vendors[1].id,
        work_order_number="WO-2026-0912",
        status="in_progress",
        scheduled_date=datetime.utcnow() + timedelta(hours=4),
        total_cost=3500.0,
        notes="Dispatched BlueLine plumbing team with brass pipe fittings."
    )
    db.add(work_order)

    # 9. Deals (Sales Pipeline)
    deal1 = Deal(
        org_id=org_id,
        property_id=created_props[0].id,
        buyer_contact_id=created_contacts[0].id,
        title="Bhopal Luxury Villa Acquisition",
        stage="negotiation",
        offer_amount=18000000.0,
        commission_rate=2.0,
        commission_amount=360000.0,
        expected_close_date=datetime.utcnow() + timedelta(days=20),
        notes="Buyer requested slight concession on closing timeline."
    )
    db.add(deal1)

    # 10. Documents Vault
    doc1 = Document(
        org_id=org_id,
        property_id=created_props[1].id,
        lease_id=lease1.id,
        title="Bandra Skyview Official Lease Agreement 2026.pdf",
        document_type="lease_agreement",
        file_url="https://estateos.ai/vault/lease_agreement_bkc_2026.pdf",
        file_format="pdf",
        file_size_bytes=1420500,
        ocr_extracted_text="Residential Tenancy Contract between Apex Real Estate Holdings and Simran Kaur. Rent ₹1,45,000/mo. Lock-in 11 months.",
        metadata_json={
            "monthly_rent": 145000,
            "security_deposit": 435000,
            "effective_date": "2026-01-15",
            "escalation_percent": 5.0
        },
        expiration_date=datetime.utcnow() + timedelta(days=275),
        is_verified=True
    )
    db.add(doc1)

    # 11. Workflows
    wf1 = WorkflowDefinition(
        org_id=org_id,
        name="Automated Delinquent Rent Dunning & Escalation",
        description="Triggered when rent passes 5 days overdue; invokes Rent Collection Agent to draft reminder and dispatch WhatsApp notification.",
        trigger_event="rent_overdue",
        is_active=True,
        nodes_json=[
            {"id": "node_1", "type": "trigger", "label": "Rent 5 Days Overdue"},
            {"id": "node_2", "type": "agent", "label": "Rent Collection Agent"},
            {"id": "node_3", "type": "action", "label": "Dispatch WhatsApp & Email"}
        ],
        edges_json=[
            {"from": "node_1", "to": "node_2"},
            {"from": "node_2", "to": "node_3"}
        ]
    )
    db.add(wf1)

    # 12. API Key for Developer Testing
    raw_api_key = "eos_live_demo1234567890abcdef"
    key_hash = hashlib.sha256(raw_api_key.encode()).hexdigest()
    api_key_obj = APIKey(
        org_id=org_id,
        user_id=created_users["admin@estateos.ai"].id,
        name="Demo Production Sandbox Key",
        key_prefix="eos_live_demo12",
        key_hash=key_hash,
        role="property_manager",
        rate_limit_per_minute=200
    )
    db.add(api_key_obj)

    # 13. ZillowCore Ingestion Pipelines
    pipeline1 = IngestionPipeline(
        feed_name="RESO_Central_India_MLS",
        source_format="RESO_Web_API",
        status="verified",
        active_adapter_version="v2026.04.1",
        adapter_wasm_binary_hash="wasm32-wasi-e9182bf90a",
        total_records_ingested=4812,
        last_sync_timestamp=datetime.utcnow()
    )
    db.add(pipeline1)

    # 14. Register all 24 AI Agents in DB
    MultiAgentOrchestrator.ensure_agents_registered(db)

    db.commit()
    print("Seeding completed successfully!")
    return org_id

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

