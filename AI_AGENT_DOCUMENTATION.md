# EstateOS AI — 24 Specialized AI Agents Documentation

EstateOS AI implements a centralized multi-agent orchestration architecture inspired by LangGraph. All 24 specialized domain agents and ZillowCore engines have registered roles, structured inputs/outputs, persistent task execution logs in `agent_tasks`, and human-in-the-loop approval gates.

---

## Agent Directory & Tested Workflows

### A. Management & Orchestration Agents
1. **Master Orchestrator Agent (`master_orchestrator`):**
   - **Role:** Parses natural language user commands, decomposes multi-stage goals, routes sub-tasks to domain agents, and guarantees transactional safety.
   - **Tested Workflow:** Receives compound commands (e.g. *"Find vacant villas in Bhopal under ₹2 Cr and prepare listing"*), routes spatial parsing to NGQR, ranks results, and logs trace.
2. **Business Intelligence Agent (`business_intelligence`):**
   - **Role:** Aggregates portfolio KPIs, analyzes occupancy trends, and detects expense anomalies.
   - **Tested Workflow:** Dynamically queries relational ledgers to compute MRR, NOI, and growth trends.
3. **Workflow Automation Agent (`workflow_automation`):**
   - **Role:** Evaluates event triggers, executes state machine nodes, and manages approval handoffs.
   - **Tested Workflow:** Listens for `rent_overdue` events, triggers dunning notifications, and logs execution logs.

### B. Property Agents
4. **Property Intelligence Agent (`property_intelligence`):**
   - **Role:** Audits property attributes for missing data, generates listing descriptions, and classifies layouts.
   - **Tested Workflow:** Extracts features and produces property descriptions.
5. **Property Valuation Agent (`property_valuation` / MVE):**
   - **Role:** Continuous multimodal valuation engine using interior computer vision cues (stone countertops, Italian marble, natural lighting), macroeconomic indices, and satellite scores.
   - **Tested Workflow:** Computes valuation with active confidence interval (e.g. 94% confidence, [₹4.08 Cr, ₹4.89 Cr]).
6. **Property Matching Agent (`property_matching`):**
   - **Role:** Matches prospective buyers and tenants based on conversational preferences and 1536-dim vector similarity.
   - **Tested Workflow:** Returns ranked properties with composite affinity scores.

### C. Customer & Sales Agents
7. **Lead Qualification Agent (`lead_qualification`):**
   - **Role:** Analyzes inquiries, scores leads (0-100), extracts budget tiers, and routes prospects.
   - **Tested Workflow:** Batch-scores inbound leads and updates Kanban priority cards.
8. **Sales Agent (`sales_agent`):**
   - **Role:** Assists brokers in proposal drafting, deal tracking, and commission calculations.
   - **Tested Workflow:** Computes 2% broker commission splits upon deal closure.
9. **Customer Communication Agent (`customer_communication`):**
   - **Role:** Drafts polite, compliant WhatsApp, SMS, and Email correspondence.
   - **Tested Workflow:** Synthesizes rent dunning reminders and site visit confirmations.
10. **Customer Retention Agent (`customer_retention`):**
    - **Role:** Detects churn risk based on unresolved maintenance requests or upcoming lease expirations.
    - **Tested Workflow:** Recommends lease renewal concessions for tenants with expiring leases.

### D. Finance Agents
11. **Financial Analysis Agent (`financial_analysis`):**
    - **Role:** Analyzes income and expenditures, audits invoices, and computes Net Operating Income.
    - **Tested Workflow:** Computes real-time P&L statement and NOI margin (78%).
12. **Rent Collection Agent (`rent_collection`):**
    - **Role:** Tracks unpaid invoices past grace periods and generates dunning notifications.
    - **Tested Workflow:** Scans invoices, identifies delinquent accounts, and prepares reminders.
13. **Investment Analysis Agent (`investment_analysis`):**
    - **Role:** Evaluates property acquisitions, computing Cap Rates, Cash-on-Cash Return, and IRR scenarios.
    - **Tested Workflow:** Evaluates a ₹2.5 Cr acquisition and returns a 5.2% Cap Rate and payback period.

### E. Maintenance Agents
14. **Maintenance Triage Agent (`maintenance_triage`):**
    - **Role:** Reads tenant repair requests, classifies category (plumbing, HVAC, electrical, etc.), determines priority, and assigns SLA.
    - **Tested Workflow:** Categorizes a kitchen leak as plumbing, assigns high priority with a 24-hour SLA, and selects the highest-rated plumber.
15. **Vendor Management Agent (`vendor_management`):**
    - **Role:** Ranks approved contractors based on ratings, pricing, and historical resolution speed.
    - **Tested Workflow:** Selects BlueLine Plumbing (4.8★) for urgent work order dispatch.
16. **Preventive Maintenance Agent (`preventive_maintenance`):**
    - **Role:** Forecasts equipment servicing schedules to avoid emergency downtime.
    - **Tested Workflow:** Schedules semi-annual HVAC inspection prior to seasonal peak cooling loads.

### F. Legal & Document Agents
17. **Document Intelligence Agent (`document_intelligence`):**
    - **Role:** OCR text analysis, extracting clauses, key milestones, and deposit terms from uploaded PDF/DOCX files.
    - **Tested Workflow:** Extracts monthly rent (₹1,45,000) and lock-in period from a scanned tenancy agreement.
18. **Lease Intelligence Agent (`lease_intelligence`):**
    - **Role:** Monitors active lease terms, computes annual 5% rent escalations, and drafts renewals.
    - **Tested Workflow:** Automatically escalates rent upon annual contract renewal.
19. **Compliance Monitoring Agent (`compliance_monitoring`):**
    - **Role:** Validates properties against fire safety, local municipal codes, and statutory GST requirements.
    - **Tested Workflow:** Verifies 18% GST tax breakdown on commercial invoices.

### G. Operational Agents
20. **Scheduling Agent (`scheduling_agent`):**
    - **Role:** Coordinates showing times and technician appointment slots.
    - **Tested Workflow:** Finds open windows between property manager and prospective tenant.
21. **Notification Agent (`notification_agent`):**
    - **Role:** Dispatches multichannel transactional notifications.
    - **Tested Workflow:** Delivers in-app and simulated SMS/WhatsApp alerts for work orders.
22. **Data Quality Agent (`data_quality_agent`):**
    - **Role:** Scans database for duplicates and incomplete listings.
    - **Tested Workflow:** Validates phone number formats and flags missing square-footage fields.
23. **Security Monitoring Agent (`security_monitoring`):**
    - **Role:** Audits tenant access patterns and flags abnormal API surges.
    - **Tested Workflow:** Logs API key rate-limiting compliance in `audit_logs`.
24. **Executive Reporting Agent (`executive_reporting`):**
    - **Role:** Prepares executive C-level briefings summarizing portfolio health.
    - **Tested Workflow:** Generates comprehensive Markdown executive memo.

---

## Human-in-the-Loop Approval Policy
Actions designated as sensitive (e.g. terminating a lease, debt write-offs, capital expenditure > ₹25,000, eviction notices) automatically create an entry in `approvals` with status `pending`. The task pauses until an authorized administrator approves or rejects it in the Agent Control Center.

