# EstateOS AI — Render Production Deployment & Operations Manual

This guide walks you through deploying **EstateOS AI (ZillowCore)** to production on **Render** via a GitHub-connected Blueprint with automatic continuous deployment (GitOps).

---

## 1. System Architecture on Render

```
                           +----------------------------------------+
                           |       GitHub Repository (main)         |
                           +-------------------+--------------------+
                                               |
                   [Automatic Webhook Deployment on git push]
                                               |
            +----------------------------------+----------------------------------+
            |                                  |                                  |
            v                                  v                                  v
+-----------------------+          +-----------------------+          +-----------------------+
|     estateos-web      |          |     estateos-api      |          |   estateos-ai-worker  |
|  (Render Static Site) |          | (Render Python Web)   |          | (Render Background)   |
|  Global Edge CDN      |          | Port 0.0.0.0:$PORT    |          | 24 Domain Agents      |
|  React 18 / Vite SPA  |          | FastAPI + Uvicorn     |          | Dunning & SLA Sentinel|
+-----------+-----------+          +-----------+-----------+          +-----------+-----------+
            |                                  |                                  |
            | (HTTPS REST / WSS)               |                                  |
            +--------------------------------->|                                  |
                                               v                                  v
                                    +---------------------+            +---------------------+
                                    |  estateos-postgres  |            |   estateos-redis    |
                                    |  Managed PostgreSQL |<-----------+   In-Memory Queue   |
                                    |  with PostGIS & JSON|            |   Task Broker/Cache |
                                    +---------------------+            +---------------------+
                                               ^
                                               | (Mounts Persistent Disk)
                                    +---------------------+
                                    |  estateos-storage   |
                                    |  10GB /var/data     |
                                    |  Docs & Photos      |
                                    +---------------------+
```

---

## 2. Infrastructure Services Summary

The platform is defined declaratively in [`render.yaml`](./render.yaml):

| Service Name | Render Type | Runtime | Build Command | Pre-Deploy / Start Command | Healthcheck |
|---|---|---|---|---|---|
| **`estateos-api`** | Web Service | Python 3.10 | `pip install --upgrade pip && pip install -r backend/requirements.txt` | Pre: `python backend/scripts/migrate_and_seed.py`<br>Start: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT` | `/health` (HTTP 200) |
| **`estateos-ai-worker`** | Worker Service | Python 3.10 | `pip install --upgrade pip && pip install -r backend/requirements.txt` | Start: `python backend/app/worker.py` | Internal Heartbeat |
| **`estateos-web`** | Static Site | Node.js 20 | `cd frontend && npm install && npm run build` | Publish: `frontend/dist`<br>Rewrite: `/* -> /index.html` | CDN Edge 200 |
| **`estateos-redis`** | Redis | Redis 7+ | Managed by Render | Internal connection string | Redis PING |
| **`estateos-postgres`** | Managed Database | PostgreSQL 16 | Managed by Render | Port 5432 with PostGIS compatibility | `SELECT 1` |

---

## 3. Step-by-Step GitHub-Connected Deployment

### Step 1: Push Repository to GitHub
Ensure your local changes are committed and pushed to your GitHub repository on branch `main`:
```bash
git add .
git commit -m "feat: prepare production deployment on Render"
git push origin main
```

### Step 2: Connect to Render Blueprint
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub account and select your **ZillowCore** (or EstateOS AI) repository.
4. Render will parse `render.yaml` and display the blueprint resources:
   - Web Service: `estateos-api`
   - Background Worker: `estateos-ai-worker`
   - Static Site: `estateos-web`
   - Redis: `estateos-redis`
   - Database: `estateos-postgres`
5. Click **Apply Blueprint**.

### Step 3: Automated Build & Pre-Deploy Seeding
Render will automatically:
1. Provision the **PostgreSQL** database and **Redis** instance.
2. Build the backend dependencies.
3. Execute `python backend/scripts/migrate_and_seed.py` as `preDeployCommand` to create all database tables and safely seed the 14 RBAC demo personas and assets.
4. Launch `uvicorn app.main:app` listening on `0.0.0.0` with the dynamically assigned `$PORT`.
5. Launch `python backend/app/worker.py` to start the autonomous 24-agent background worker.
6. Compile the React/Vite frontend and deploy it to Render's global CDN.

### Step 4: Automatic Continuous Deployment (GitOps)
Every time you push new code to the `main` branch:
- Render triggers an automatic webhook build.
- Pre-deploy migrations verify table schemas.
- Zero-downtime rolling deploys transition traffic to the new release.

---

## 4. Production Security & Secrets Configuration

All sensitive keys are isolated through Render environment variables:

1. **JWT Encryption Key (`SECRET_KEY`)**:
   Render automatically generates a cryptographically random 64-character key via `generateValue: true`.
2. **Database Credentials (`DATABASE_URL`)**:
   Render links `estateos-postgres` directly to `estateos-api` and `estateos-ai-worker`. The backend code automatically normalizes `postgres://` to `postgresql://` for SQLAlchemy 2.0.
3. **CORS Security**:
   `CORS_ORIGIN_REGEX` is pre-configured to `^https:\/\/.*\.onrender\.com$`, ensuring all preview and production frontend domains on Render have authorized cross-origin access with credentials.
4. **LLM Provider API Keys (Optional)**:
   In the Render dashboard under **estateos-api** → **Environment**:
   - `OPENAI_API_KEY`: Enter your `sk-...` key if using live OpenAI models.
   - `GEMINI_API_KEY`: Enter your `AIza...` key if using Google Gemini.
   - *Note:* If omitted, `AI_DEMO_MODE=true` ensures 100% of the 24 AI domain agents, NGQR spatial routing, and MVE valuation algorithms execute with zero-latency deterministic responses.

---

## 5. Post-Deployment Verification Checklist

Once the deployment completes, verify the live deployment using these checks:

### 1. Backend Health Check
```bash
curl -f https://<your-estateos-api>.onrender.com/health
```
**Expected Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "service": "EstateOS AI / ZillowCore Enterprise API",
  "version": "1.0.0",
  "database": "healthy",
  "agents_online": 24,
  "ngqr_status": "operational",
  "mve_status": "operational",
  "reso_sandbox_status": "operational"
}
```

### 2. Interactive Swagger API Docs
Visit: `https://<your-estateos-api>.onrender.com/docs`

### 3. Demo Persona Sign-In Test
```bash
curl -X POST https://<your-estateos-api>.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estateos.ai","password":"Admin@123"}'
```
**Expected Response:** Returns JSON with `access_token` and user profile (`Vikramaditya Singhania`, role: `super_admin`).

### 4. Natural Language AI Command Center Test
```bash
curl -X POST https://<your-estateos-api>.onrender.com/api/v1/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"prompt":"find 3BHK villas in Bhopal under 2 Crore"}'
```

### 5. Frontend Web Application
Navigate to `https://<your-estateos-web>.onrender.com` in your web browser:
- Light enterprise theme loads cleanly.
- Choose any of the 6 one-click demo personas (Super Admin, Property Mgr, Real Estate Agent, Accountant, Facility Mgr, Resident).
- Verify each persona lands on their tailored workspace.

---

## 6. Troubleshooting & Operational Commands

### Viewing Logs in Render
- **API Logs:** Go to `estateos-api` → **Logs** in the Render dashboard. Look for `Uvicorn running on http://0.0.0.0:<PORT>`.
- **Worker Logs:** Go to `estateos-ai-worker` → **Logs**. Look for `Heartbeat: 24 domain agents active`.
- **Frontend Build Logs:** Go to `estateos-web` → **Events** → **Deploy Logs**.

### Manually Re-triggering Seeding
You can open an SSH shell on the `estateos-api` service in Render and run:
```bash
python backend/scripts/migrate_and_seed.py
```

### Connecting Desktop Application to Render Production
To point your native desktop edition to the live Render backend:
1. Open the web app in your browser or desktop shell.
2. In the browser console, run:
   ```javascript
   localStorage.setItem('estateos_api_url', 'https://<your-estateos-api>.onrender.com/api/v1');
   location.reload();
   ```
   Or launch with `VITE_API_URL=https://<your-estateos-api>.onrender.com`.
