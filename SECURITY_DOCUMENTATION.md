# EstateOS AI — Enterprise Security & Multi-Tenancy Architecture

## 1. Multi-Tenant Data Isolation
Multi-tenancy in EstateOS AI is strictly enforced at the database and API authorization layers:
1. Every relational table contains `org_id UUID NOT NULL` indexed foreign key to `organizations`.
2. All authenticated API requests require either a signed JWT bearer token or an authorized API Key (`X-API-Key`).
3. The FastAPI dependency `get_current_user` extracts the caller's organization ID from the verified cryptographic payload.
4. Database queries filter on `org_id == current_user.org_id`. Cross-tenant queries return `404 Not Found` or `403 Forbidden`.
5. Automated test `test_cross_tenant_isolation_enforcement` mathematically verifies that Organization A cannot inspect or modify Organization B's property assets, leases, or financials.

---

## 2. 14-Role Granular RBAC Matrix
EstateOS AI implements 14 distinct roles:
1. `super_admin`: Global platform administrator with multi-tenant oversight.
2. `org_owner`: Complete administrative control over organization settings, billing, and team roles.
3. `org_admin`: Organizational management, user onboarding, and policy configuration.
4. `property_manager`: Full CRUD operations on properties, units, leases, and tenant assignments.
5. `real_estate_agent`: Listing exploration, customer inquiries, CRM Kanban leads, and deal commissions.
6. `accountant`: Financial transaction ledgers, invoicing, GST compliance, and P&L statements.
7. `facility_manager`: Maintenance ticket assignment, SLA monitoring, and vendor work orders.
8. `maintenance_staff`: Work order execution, completion verification, and status updates.
9. `legal_officer`: Contract review, lease compliance, OCR document analysis, and dispute resolution.
10. `vendor`: Work order acknowledgment, status submission, and payment invoice tracking.
11. `landlord`: Property portfolio performance oversight and net income tracking.
12. `tenant`: Resident portal, rent payment submission, and maintenance request intake.
13. `investor`: Capitalization rates, portfolio valuation reports, and ROI projections.
14. `readonly_analyst`: Read-only access to reporting dashboards and business intelligence metrics.

---

## 3. Cryptography & Key Management
- **Passwords:** Hashed with PBKDF2 using SHA-256 and unique 16-byte cryptographic salts with 100,000 iterations.
- **JWT Sessions:** Signed using HMAC-SHA256 with 7-day expiration windows.
- **API Keys:** Never stored in plaintext. Raw keys (`eos_live_...`) are returned once upon creation; the database stores only SHA-256 digests.
- **Audit Trails:** Immutable append-only logging in `audit_logs` tracking IP addresses, user IDs, agent codes, timestamps, and target resource IDs.

