"""Reusable FastAPI auth dependencies."""
from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Profile
from app.security import verify_token

_bearer = HTTPBearer(auto_error=True)
_bearer_optional = HTTPBearer(auto_error=False)


def _profile_from_claims(db: Session, claims: dict) -> Profile:
    """Map a verified token's `sub` to a profile, creating one on first sight."""
    user_id = uuid.UUID(claims["sub"])
    profile = db.get(Profile, user_id)
    if profile is None:
        meta = claims.get("user_metadata") or {}
        name = meta.get("username") or (claims.get("email") or "").split("@")[0] or "user"
        profile = Profile(profile_id=user_id, name=name)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Profile:
    """Require a valid Supabase JWT; return the caller's profile (401 otherwise)."""
    return _profile_from_claims(db, verify_token(creds.credentials))


def get_current_user_optional(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer_optional),
    db: Session = Depends(get_db),
) -> Profile | None:
    """Return the caller's profile if a valid token is present, else None."""
    if creds is None:
        return None
    try:
        return _profile_from_claims(db, verify_token(creds.credentials))
    except HTTPException:
        return None
