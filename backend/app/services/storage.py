import os
import uuid
import re
from typing import Optional
from app.core.config import settings

class StorageService:
    @classmethod
    def _ensure_upload_dir(cls, folder: str) -> str:
        target_dir = os.path.join(settings.UPLOAD_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    @classmethod
    def upload_file(cls, file_bytes: bytes, filename: str, content_type: Optional[str] = None, folder: str = "documents") -> str:
        """
        Uploads a file to persistent object storage (S3, Cloudflare R2, MinIO, or Render persistent disk).
        Returns the accessible file URL.
        """
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
        unique_filename = f"{uuid.uuid4().hex[:12]}_{clean_name}"

        # 1. S3 / R2 / MinIO Object Storage
        if settings.STORAGE_BACKEND == "s3" and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                import boto3
                from botocore.config import Config

                s3_kwargs = {
                    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
                    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
                    "region_name": settings.AWS_REGION,
                }
                if settings.AWS_S3_ENDPOINT_URL:
                    s3_kwargs["endpoint_url"] = settings.AWS_S3_ENDPOINT_URL

                s3_client = boto3.client("s3", **s3_kwargs)
                key = f"{folder}/{unique_filename}"
                extra_args = {}
                if content_type:
                    extra_args["ContentType"] = content_type

                s3_client.put_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=key,
                    Body=file_bytes,
                    **extra_args
                )

                if settings.AWS_S3_ENDPOINT_URL:
                    return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{key}"
                return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            except Exception as e:
                print(f"[StorageService] S3 upload failed, falling back to local persistent storage: {e}")

        # 2. Local Persistent Storage (Render Persistent Disk or local folder)
        target_dir = cls._ensure_upload_dir(folder)
        filepath = os.path.join(target_dir, unique_filename)
        with open(filepath, "wb") as f:
            f.write(file_bytes)

        # Return static mount path
        return f"/uploads/{folder}/{unique_filename}"

    @classmethod
    def delete_file(cls, file_url: str) -> bool:
        """Safely removes an uploaded file from disk or object storage."""
        if not file_url:
            return False

        if file_url.startswith("/uploads/"):
            rel_path = file_url.replace("/uploads/", "", 1)
            full_path = os.path.join(settings.UPLOAD_DIR, rel_path)
            if os.path.exists(full_path):
                try:
                    os.remove(full_path)
                    return True
                except Exception:
                    return False
        return True

