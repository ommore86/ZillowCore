from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.middleware import get_current_user
from app.models.models import User, Organization
from app.schemas.schemas import LoginRequest, RegisterRequest, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(
        subject=user.id,
        org_id=user.org_id,
        role=user.role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        org_id=user.org_id,
        role=user.role,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/register", response_model=Token)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create new Organization
    slug = payload.organization_name.lower().replace(" ", "-").replace(".", "")
    # ensure unique slug
    org_count = db.query(Organization).filter(Organization.slug.like(f"{slug}%")).count()
    if org_count > 0:
        slug = f"{slug}-{org_count + 1}"

    org = Organization(
        name=payload.organization_name,
        slug=slug,
        subscription_tier="enterprise",
        currency="INR",
        tax_rate=18.0
    )
    db.add(org)
    db.flush()

    # Create Admin User
    user = User(
        org_id=org.id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role or "org_owner",
        phone=payload.phone,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        subject=user.id,
        org_id=user.org_id,
        role=user.role
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        org_id=user.org_id,
        role=user.role,
        full_name=user.full_name,
        email=user.email
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

