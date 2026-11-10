# EstateOS AI — Environment Variables Specification

This document details all configuration variables utilized across EstateOS AI services.

---

## Backend Environment Variables

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `sqlite:///./estateos.db` | Connection URI for SQLite (local) or PostgreSQL with PostGIS (production) |
| `SECRET_KEY` | Yes | Secure 64-char key | HMAC-SHA256 secret key for signing JWT bearer tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `10080` (7 days) | Expiration window for authenticated session tokens |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Cache, pub/sub, and task queue coordinator |
| `OPENAI_API_KEY` | No | `""` | Optional live OpenAI API key for LLM queries |
| `GEMINI_API_KEY` | No | `""` | Optional Google Gemini API key |
| `AI_DEMO_MODE` | No | `true` | When true, guarantees 100% deterministic, zero-latency AI responses even without 3rd-party API keys |
| `RATE_LIMIT_PER_MINUTE` | No | `120` | Default API rate limit for developer keys |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins list |

---

## Frontend Environment Variables

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8000/api/v1` | Base URL of the backend REST API |
| `PORT` | No | `3000` | Local development port |

