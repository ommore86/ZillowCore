from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.services.seed_data import seed_database

# Include Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as org_router
from app.api.v1.properties import router as properties_router
from app.api.v1.geospatial import router as geospatial_router
from app.api.v1.valuation import router as valuation_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.crm import router as crm_router
from app.api.v1.leases import router as leases_router
from app.api.v1.finance import router as finance_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.sales import router as sales_router
from app.api.v1.documents import router as documents_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.reports import router as reports_router
from app.api.v1.agents import router as agents_router
from app.api.v1.command import router as command_router
from app.api.v1.automations import router as automations_router
from app.api.v1.developer import router as developer_router
from app.api.v1.health import router as health_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "EstateOS AI / ZillowCore — Autonomous Real Estate Operating System API Platform.\n"
        "Features Neural Geo-Spatial Query Router (NGQR), Multimodal Valuation Engine (MVE), "
        "Autonomous RESO Ingestion Sandbox, and LangGraph 24-Agent Multi-Agent Orchestrator."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Versioned Routes under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(org_router, prefix=api_prefix)
app.include_router(properties_router, prefix=api_prefix)
app.include_router(geospatial_router, prefix=api_prefix)
app.include_router(valuation_router, prefix=api_prefix)
app.include_router(ingestion_router, prefix=api_prefix)
app.include_router(crm_router, prefix=api_prefix)
app.include_router(leases_router, prefix=api_prefix)
app.include_router(finance_router, prefix=api_prefix)
app.include_router(maintenance_router, prefix=api_prefix)
app.include_router(sales_router, prefix=api_prefix)
app.include_router(documents_router, prefix=api_prefix)
app.include_router(vendors_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(agents_router, prefix=api_prefix)
app.include_router(command_router, prefix=api_prefix)
app.include_router(automations_router, prefix=api_prefix)
app.include_router(developer_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)
app.include_router(health_router, prefix="")

# WebSocket for Real-time AI Agent execution streaming
@app.websocket("/api/v1/ws/stream")
async def websocket_ai_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat or stream agent execution status
            await websocket.send_json({
                "type": "agent_heartbeat",
                "message": f"EstateOS Orchestrator listening: {data[:50]}",
                "active_agents": 24
            })
    except WebSocketDisconnect:
        pass

@app.on_event("startup")
def startup_event():
    # Automatically ensure database tables and seed data exist
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/")
def root_endpoint():
    return {
        "project": "EstateOS AI / ZillowCore",
        "tagline": "The Autonomous Real Estate Operating System",
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": "/api/v1",
        "health": "/health"
    }

