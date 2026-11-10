# EstateOS AI — Enterprise User Guide

Welcome to **EstateOS AI (The Autonomous Real Estate Operating System)**.

---

## 1. Getting Started & Logging In

1. Open the web application (`http://localhost:3000`) or launch the native desktop application (`desktop/run_desktop.py`).
2. On the login screen, enter your corporate credentials or click any of the **One-Click Demo Personas**:
   - **👑 Super Admin:** `admin@estateos.ai` / `Admin@123`
   - **🏢 Property Manager:** `manager@estateos.ai` / `Admin@123`
   - **💼 Real Estate Agent:** `agent@estateos.ai` / `Admin@123`
   - **📊 Accountant:** `finance@estateos.ai` / `Admin@123`
3. Click **Sign In to Platform**.

---

## 2. Omnipresent AI Command Center (`Ctrl+K`)

Press `Ctrl+K` (or click the search bar at the top of any screen) to open the AI Command Center. You can issue instructions in natural conversational language:
- *"Find luxury 4BHK villas in Bhopal under ₹2 Crore"*
- *"Run multimodal valuation on BKC Mumbai apartment"*
- *"Identify tenants with delinquent rent and draft reminder"*
- *"Generate monthly executive operations summary"*

The Command Center displays:
1. Deconstructed intent.
2. The specialized agent dispatched.
3. Live step-by-step execution traces.
4. Synthesized executive markdown summary and matching property cards.

---

## 3. ZillowCore Core Sub-Engines

### A. Multimodal Valuation Engine (MVE / Autonomous Zestimate)
1. Click **MVE Valuation** in the top navigation bar.
2. Select property type, market, carpet area, bedrooms, and toggle interior visual features (Italian marble, modular kitchen, smart home automation).
3. Click **Compute Continuous Valuation**.
4. Inspect the valuation, rental estimate, and **Active Confidence Interval** with satellite infrastructure ratings.

### B. Geo-Spatial PostGIS Explorer
1. Click **Geo-Spatial Map** in the top bar.
2. Select target operating centroids (Bhopal, Mumbai, Bengaluru, Delhi NCR, Pune).
3. Click any property pin on the spatial grid to inspect coordinates, valuation, floor space, and amenities.

### C. Autonomous RESO Ingestion Sandbox
1. Click **RESO Sandbox** in the top bar.
2. Inspect upstream MLS feeds, view schema drifts, and click **Execute Self-Healing Pipeline Loop**.
3. View the auto-synthesized Rust WebAssembly adapter and 100% test-suite extraction score.

---

## 4. Daily Operational Workflows

- **Properties:** Add properties, filter by type/city, and export inventory to CSV via **Export CSV**.
- **CRM & Kanban Pipeline:** Drag and drop prospective leads across the 6 stages (`New Lead` → `Contacted` → `Qualified` → `Site Visit` → `Negotiation` → `Converted`).
- **Finance & Invoicing:** View accounts receivable invoices with 18% GST calculation. Click **Settle Payment** to record verified double-entry journal transactions.
- **Maintenance & AI Triage:** Submit repair requests. The Maintenance Triage Agent automatically classifies urgency and dispatches the work order.
- **Agent Control Center:** View all 24 registered domain agents, execution latency, token costs, and approve or reject tasks in the **Human-in-the-Loop Approval Queue**.

