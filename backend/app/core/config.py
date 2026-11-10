import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "EstateOS AI / ZillowCore"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "estateos-super-secret-production-encryption-key-2026-zillowcore")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Server Binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./estateos.db")
    
    # Redis / Message Queue / Task Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # LLM / AI Config
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_DEMO_MODE: bool = os.getenv("AI_DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,tauri://localhost,https://tauri.localhost"
        ).split(",")
        if origin.strip()
    ]
    # Automatically allows all preview and production *.onrender.com frontend domains
    CORS_ORIGIN_REGEX: Optional[str] = os.getenv("CORS_ORIGIN_REGEX", r"^https:\/\/.*\.onrender\.com$")
    
    # Object Storage Configuration (S3, Cloudflare R2, MinIO, or Persistent Disk)
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")  # local, s3, cloudinary
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/var/data/uploads" if os.path.exists("/var/data") else "uploads")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_STORAGE_BUCKET_NAME: str = os.getenv("AWS_STORAGE_BUCKET_NAME", "estateos-storage")
    AWS_S3_ENDPOINT_URL: Optional[str] = os.getenv("AWS_S3_ENDPOINT_URL", None)
    CLOUDINARY_URL: Optional[str] = os.getenv("CLOUDINARY_URL", None)

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))

settings = Settings()
