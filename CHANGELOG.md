# Changelog — EstateOS AI (ZillowCore)

All notable changes to the EstateOS AI platform are documented in this file.

## [1.0.0] - 2026-11-09
### Added
- **ZillowCore Engine:**
  - Neural Geo-Spatial Query Router (NGQR) parsing conversational spatial intent into PostGIS bounding boxes and 1536-dim vectors.
  - Multimodal Valuation Engine (MVE / Autonomous Zestimate) with active confidence matrix and computer vision texture cues.
  - Autonomous RESO/Data Ingestion Sandbox featuring anomaly detection, auto-adapter synthesis, and mock cache verification.
  - Core Real Estate Structural Ledger (`property_master_ledger`) with spatial and HNSW vector indexes.
- **EstateOS SaaS Architecture:**
  - 14-Role Granular RBAC and organization-scoped multi-tenancy.
  - 10 Enterprise Modules: Properties, Units, Contacts, Leads (6-stage Kanban), Leases, Financials (INR/GST), Maintenance (AI Triage), Sales Deals, Documents (OCR), Vendors.
  - LangGraph centralized Multi-Agent Orchestrator with 24 specialized domain agents and Human-in-the-Loop approval queue.
  - Full-screen AI Command Center and global `Ctrl+K` command palette.
  - Visual Workflow Automation Builder.
  - Developer API platform with interactive Swagger docs, API keys, webhooks, and SDK integration examples.
  - Tauri desktop application bundle configuration and Windows native desktop launcher.
  - 13 Automated test suites passing with 100% success rate.

