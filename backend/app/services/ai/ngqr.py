import re
import json
import hashlib
import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import Property, PropertyMasterLedger

# Known city coordinates for spatial bounding boxes and proximity calculations
GEO_CENTROIDS = {
    "bhopal": (23.2599, 77.4126),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "pune": (18.5204, 73.8567),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "san francisco": (37.7749, -122.4194),
    "new york": (40.7128, -74.0060),
}

def extract_price_ceiling(query: str) -> float:
    """Extracts budget limits in Lakh, Crore, or plain numbers (e.g. under ₹2,00,00,000 or under 50 lakh)"""
    q = query.lower().replace(",", "")
    
    # Check for Crore (cr or crore)
    cr_match = re.search(r'(?:under|below|less than|max|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9.]+)\s*(?:cr|crore|crores)', q)
    if cr_match:
        return float(cr_match.group(1)) * 10000000.0

    # Check for Lakh (lakh, lac, lk)
    lakh_match = re.search(r'(?:under|below|less than|max|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9.]+)\s*(?:lakh|lakhs|lac|lacs)', q)
    if lakh_match:
        return float(lakh_match.group(1)) * 100000.0

    # Plain amount match with ₹ or Rs or $
    amt_match = re.search(r'(?:under|below|less than|max)\s*(?:₹|rs\.?|\$)\s*([0-9]+)', q)
    if amt_match:
        return float(amt_match.group(1))

    return 500000000.0  # Default generous ceiling: 50 Crore

def extract_city(query: str) -> Optional[str]:
    q = query.lower()
    for city in GEO_CENTROIDS.keys():
        if city in q:
            return city
    return None

def generate_pseudo_embedding(text: str, dim: int = 1536) -> List[float]:
    """
    Generates a deterministic normalized high-dimensional semantic projection vector.
    Used for vector similarity search in the absence of external LLM API tokens.
    """
    vector = []
    # Seed hashing from tokens
    tokens = text.lower().split()
    for i in range(dim):
        val = 0.0
        for token in tokens:
            h = int(hashlib.sha256(f"{token}:{i}".encode()).hexdigest()[:8], 16)
            val += ((h % 2000) - 1000) / 1000.0
        vector.append(round(val, 5))
    
    # Normalize to unit length
    norm = math.sqrt(sum(x * x for x in vector)) or 1.0
    return [round(x / norm, 6) for x in vector]

def compute_cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.5
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))

class NeuralGeoSpatialQueryRouter:
    """
    Implements Module A: Neural Geo-Spatial Query Router (NGQR) from PDF p.3-4.
    Replaces static filtering with conversational intent mapping, dynamic geofencing,
    and vector matchmaking.
    """

    @staticmethod
    def route_spatial_intent(
        db: Session,
        natural_language_query: str,
        current_bounding_box_geojson: Optional[str] = None,
        target_result_limit: int = 10,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        city = extract_city(natural_language_query)
        price_ceiling = extract_price_ceiling(natural_language_query)
        
        # 1. Synthesize targeted PostGIS query
        if city and city in GEO_CENTROIDS:
            lat, lon = GEO_CENTROIDS[city]
            targeted_postgis_sql = (
                f"SELECT property_id, parcel_number, current_valuation_amount, "
                f"ST_Distance(geo_location, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)) AS distance_meters "
                f"FROM property_master_ledger "
                f"WHERE ST_DWithin(geo_location, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326), 25000) "
                f"AND current_valuation_amount <= {price_ceiling:.2f} "
                f"ORDER BY distance_meters ASC LIMIT {target_result_limit};"
            )
        else:
            targeted_postgis_sql = (
                f"SELECT property_id, parcel_number, current_valuation_amount "
                f"FROM property_master_ledger "
                f"WHERE current_valuation_amount <= {price_ceiling:.2f} "
                f"ORDER BY current_valuation_amount ASC LIMIT {target_result_limit};"
            )

        # 2. Execution plan hash
        plan_hash_seed = f"{targeted_postgis_sql}:{natural_language_query}:{price_ceiling}"
        plan_hash = hashlib.sha256(plan_hash_seed.encode()).hexdigest()[:16]

        # 3. Vector embedding for interior style & ambient features
        query_vector = generate_pseudo_embedding(natural_language_query, dim=1536)

        # 4. Execute query over application properties
        q_props = db.query(Property)
        if org_id:
            q_props = q_props.filter(Property.org_id == org_id)
        
        # Filter by price ceiling
        q_props = q_props.filter(Property.current_valuation <= price_ceiling)
        
        if city:
            q_props = q_props.filter(Property.city.ilike(f"%{city}%"))

        candidate_props = q_props.all()
        
        # Rank by vector cosine similarity and spatial proximity
        ranked_properties = []
        for prop in candidate_props:
            prop_embedding = prop.interior_visual_embedding or generate_pseudo_embedding(
                f"{prop.title} {prop.property_type} {prop.description} {' '.join(prop.amenities or [])}"
            )
            sim_score = compute_cosine_similarity(query_vector, prop_embedding)
            
            # Distance from target centroid if city provided
            dist_km = 0.0
            if city and city in GEO_CENTROIDS:
                c_lat, c_lon = GEO_CENTROIDS[city]
                dist_km = round(
                    math.sqrt((prop.latitude - c_lat)**2 + (prop.longitude - c_lon)**2) * 111.0, 2
                )

            composite_score = round(sim_score * 0.7 + (1.0 / (1.0 + dist_km * 0.05)) * 0.3, 4)

            ranked_properties.append({
                "id": prop.id,
                "title": prop.title,
                "parcel_number": prop.parcel_number,
                "city": prop.city,
                "state": prop.state,
                "latitude": prop.latitude,
                "longitude": prop.longitude,
                "geohash": prop.geohash,
                "property_type": prop.property_type,
                "current_valuation": float(prop.current_valuation),
                "rental_value": float(prop.rental_value),
                "area_sqft": prop.area_sqft,
                "bedrooms": prop.bedrooms,
                "bathrooms": prop.bathrooms,
                "featured_image": prop.featured_image,
                "similarity_score": round(sim_score, 4),
                "distance_km": dist_km,
                "composite_rank_score": composite_score
            })

        # Sort descending by composite score
        ranked_properties.sort(key=lambda x: x["composite_rank_score"], reverse=True)
        final_matched = ranked_properties[:target_result_limit]

        explanation = (
            f"Evaluated spatial query intent for '{natural_language_query}'. "
            f"Parsed city scope: {city.title() if city else 'All Regions'}, "
            f"Price Ceiling: ₹{price_ceiling:,.0f}. Found {len(final_matched)} matching assets."
        )

        return {
            "targeted_postgis_sql": targeted_postgis_sql,
            "query_vector_embedding": query_vector[:16],  # Return preview of 16 dims for clean response payload
            "optimized_execution_plan_hash": f"0x{plan_hash}",
            "strict_price_ceiling": price_ceiling,
            "matched_properties": final_matched,
            "explanation": explanation
        }

