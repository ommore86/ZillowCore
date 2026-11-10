# EstateOS AI / ZillowCore — Deployment & Operations Guide

This guide details how to deploy EstateOS AI to production (Render, Vercel, Docker, or native Windows).

---

## 1. Quickstart with Docker Compose

Run the entire platform (PostgreSQL with PostGIS, Redis, FastAPI Backend, and React Frontend) with a single command:

```bash
docker-compose up --build -d
```

- **Frontend Web Application:** `http://localhost:3000`
- **FastAPI Enterprise Backend:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **PostgreSQL Database:** `localhost:5432` (User: `estateos_user`, DB: `estateos`)

---

## 2. Production Deployment on Render

EstateOS AI includes a native `render.yaml` Blueprint specification.

### Steps:
1. Fork or push this repository to GitHub.
2. In the Render Dashboard, click **New +** → **Blueprint**.
3. Select this repository. Render will automatically provision:
   - **estateos-postgres:** Managed PostgreSQL database with PostGIS extensions.
   - **estateos-api:** Python web service running FastAPI and LangGraph multi-agent orchestrator.
   - **estateos-web:** Static web service compiling and hosting the React/Next frontend.
4. Set the following environment variables if live LLM providers are desired:
   - `OPENAI_API_KEY`: `sk-...` (Optional; fallback deterministic AI engine active if omitted)
   - `GEMINI_API_KEY`: `AIza...` (Optional)
5. Click **Apply Blueprint**. The database seeds automatically on first startup.

---

## 3. Local Development Setup

### Backend:
```bash
cd backend
python -m pip install -r requirements.txt
$env:PYTHONPATH="backend"  # PowerShell
# or export PYTHONPATH=backend (Linux/macOS)

# Run migrations & seed data
python -m app.services.seed_data

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
# Starts at http://localhost:3000
```

---

## 4. Desktop Windows Installer Build

```bash
cd desktop
.\build_windows_installer.bat
# or launch the portable desktop shell directly:
python run_desktop.py
```

