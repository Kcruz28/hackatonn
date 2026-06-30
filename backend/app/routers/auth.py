"""Auth endpoints — signup, login (by username), me. Backed by Supabase Auth.

Users authenticate with username + password. Internally each user is a Supabase
Auth user keyed by a real email; we resolve username -> email at login. The
profile's `profile_id` equals the Supabase user id, so a verified token maps
straight to a profile.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.common import ProfileSummary
from app.database import get_db
from app.deps import get_current_user
from app.models import Profile
from app.supabase_client import admin_create_user, admin_get_user, password_login

router = APIRouter(prefix="/auth", tags=["auth"])


# ---- Schemas ---------------------------------------------------------------

class SignupRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None
    profile: ProfileSummary


# ---- Endpoints -------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Create a user + profile and return a session."""
    if db.query(Profile).filter(Profile.name == payload.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = admin_create_user(payload.email, payload.password, payload.username)
    profile = Profile(profile_id=uuid.UUID(user["id"]), name=payload.username)
    db.add(profile)
    db.commit()
    db.refresh(profile)

    session = password_login(payload.email, payload.password)
    return AuthResponse(
        access_token=session["access_token"],
        refresh_token=session.get("refresh_token"),
        profile=ProfileSummary.model_validate(profile),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Log in with either a username or an email, plus password."""
    identifier = payload.username.strip()

    if "@" in identifier:
        # Email login: validate the password, then resolve the profile by user id.
        session = password_login(identifier, payload.password)
        user_id = (session.get("user") or {}).get("id")
        profile = db.get(Profile, uuid.UUID(user_id)) if user_id else None
    else:
        profile = db.query(Profile).filter(Profile.name == identifier).first()
        if profile is None:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        email = admin_get_user(str(profile.profile_id)).get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        session = password_login(email, payload.password)

    if profile is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return AuthResponse(
        access_token=session["access_token"],
        refresh_token=session.get("refresh_token"),
        profile=ProfileSummary.model_validate(profile),
    )


@router.get("/me", response_model=ProfileSummary)
def me(current: Profile = Depends(get_current_user)):
    """Return the authenticated caller's profile."""
    return current
