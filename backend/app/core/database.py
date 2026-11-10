import math
import json
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Engine configuration
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Custom SQLite functions for Geo-Spatial and Vector operations when running on SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        # 1. Haversine distance in meters
        def haversine_distance(lat1, lon1, lat2, lon2):
            if None in (lat1, lon1, lat2, lon2):
                return None
            R = 6371000.0  # Earth radius in meters
            phi1 = math.radians(float(lat1))
            phi2 = math.radians(float(lat2))
            delta_phi = math.radians(float(lat2) - float(lat1))
            delta_lambda = math.radians(float(lon2) - float(lon1))
            
            a = math.sin(delta_phi / 2.0) ** 2 + \
                math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        # 2. Bounding box check
        def in_bounding_box(lat, lon, min_lat, min_lon, max_lat, max_lon):
            if None in (lat, lon, min_lat, min_lon, max_lat, max_lon):
                return 0
            lat, lon = float(lat), float(lon)
            min_lat, min_lon = float(min_lat), float(min_lon)
            max_lat, max_lon = float(max_lat), float(max_lon)
            return 1 if (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon) else 0

        # 3. Vector Cosine Similarity
        def vector_cosine_sim(v1_str, v2_str):
            try:
                v1 = json.loads(v1_str) if isinstance(v1_str, str) else v1_str
                v2 = json.loads(v2_str) if isinstance(v2_str, str) else v2_str
                if not v1 or not v2 or len(v1) != len(v2):
                    return 0.0
                dot = sum(a * b for a, b in zip(v1, v2))
                norm_a = math.sqrt(sum(a * a for a in v1))
                norm_b = math.sqrt(sum(b * b for b in v2))
                if norm_a == 0 or norm_b == 0:
                    return 0.0
                return float(dot / (norm_a * norm_b))
            except Exception:
                return 0.0

        dbapi_connection.create_function("haversine_distance", 4, haversine_distance)
        dbapi_connection.create_function("in_bounding_box", 6, in_bounding_box)
        dbapi_connection.create_function("vector_cosine_sim", 2, vector_cosine_sim)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

