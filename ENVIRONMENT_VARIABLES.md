# EstateOS AI — Enterprise Environment Variables Specification

This document details all configuration parameters and secrets across EstateOS AI services (API, AI Worker, Frontend, Database, and Object Storage).

---

## 1. FastAPI Enterprise Backend (`estateos-api`)

| Variable Name | Required | Default / Blueprint Value | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `fromDatabase: estateos-postgres` | PostgreSQL connection string (`postgresql://user:pass@host:5432/estateos`) |
| `REDIS_URL` | Yes | `fromService: estateos-redis` | Redis broker and cache connection string (`redis://red-...:6379`) |
| `SECRET_KEY` | Yes | `generateValue: true` | Cryptographic secret for signing JWT access tokens (HS256) |
| `ENVIRONMENT` | No | `production` | Deployment runtime stage (`production`, `staging`, `development`) |
| `PORT` | Yes (Render) | Assigned by Render (e.g. `10000`) | Network port on which Uvicorn binds (`0.0.0.0`) |
| `PYTHONPATH` | Yes | `backend` | Ensures root Python path resolves `app.*` imports cleanly |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `10080` (7 days) | Session token TTL window |
| `AI_DEMO_MODE` | No | `true` | When true, provides sub-50ms deterministic responses for all 24 AI agents when 3rd-party LLMs are omitted |
| `OPENAI_API_KEY` | No | `""` (Manual secret) | Optional OpenAI API key for live GPT-4o / embeddings calls |
| `GEMINI_API_KEY` | No | `""` (Manual secret) | Optional Google Gemini API key |
| `CORS_ORIGINS` | No | `http://localhost:3000,tauri://localhost` | Comma-delimited explicit allowed origin domains |
| `CORS_ORIGIN_REGEX` | No | `^https:\/\/.*\.onrender\.com$` | Regex permitting all Render preview and production web hostnames |
| `STORAGE_BACKEND` | No | `local` | Storage provider: `local` (Render persistent disk) or `s3` |
| `UPLOAD_DIR` | No | `/var/data/uploads` | Path to persistent disk mount for images and documents |
| `AWS_ACCESS_KEY_ID` | Optional | `""` | AWS S3 / Cloudflare R2 access key |
| `AWS_SECRET_ACCESS_KEY` | Optional | `""` | AWS S3 / Cloudflare R2 secret key |
| `AWS_REGION` | Optional | `us-east-1` | AWS S3 bucket region |
| `AWS_STORAGE_BUCKET_NAME`| Optional | `estateos-storage` | Target S3 bucket name |
| `AWS_S3_ENDPOINT_URL` | Optional | `""` | S3 endpoint URL (for Cloudflare R2, MinIO, or Supabase Storage) |
| `RATE_LIMIT_PER_MINUTE` | No | `120` | Tier-1 default developer rate limit |

---

## 2. AI Background Worker Daemon (`estateos-ai-worker`)

| Variable Name | Required | Default / Blueprint Value | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `fromDatabase: estateos-postgres` | Connection to PostgreSQL to pull agent tasks and run monitors |
| `REDIS_URL` | Yes | `fromService: estateos-redis` | Connection to Redis queue broker |
| `SECRET_KEY` | Yes | `fromService: estateos-api` | Shared symmetric key for token validation |
| `ENVIRONMENT` | No | `production` | Production execution profile |
| `PYTHONPATH` | Yes | `backend` | Python import resolution root |
| `AI_DEMO_MODE` | No | `true` | Deterministic fallback execution flag |
| `OPENAI_API_KEY` | No | `""` | Optional LLM provider key |
| `GEMINI_API_KEY` | No | `""` | Optional LLM provider key |

---

## 3. React / Next.js Static Frontend (`estateos-web`)

| Variable Name | Required | Default / Blueprint Value | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `fromService: estateos-api (host)` | Injected Render backend hostname (e.g. `estateos-api.onrender.com`) |
| `VITE_API_BASE_URL` | Yes | `fromService: estateos-api (host)` | Full backend API URL (auto-normalized to `https://.../api/v1`) |
| `NODE_VERSION` | No | `20.11.0` | Node.js compilation runtime version |
