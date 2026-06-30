"""Shared Pydantic response models and DB helpers for the social/profile endpoints.

Identity note: the live `profiles.name` column is NOT unique, so UUID `profile_id`
is the canonical identifier for relationships and write payloads. For convenience,
list endpoints accept a `profile` query that is EITHER a UUID or a name (first match).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.models import Profile


class ProfileSummary(BaseModel):
    """Lightweight reference to a profile, embedded wherever one is referenced."""

    model_config = ConfigDict(from_attributes=True)

    profile_id: uuid.UUID
    name: str
    avatar_url: str | None = None


class FollowEdge(BaseModel):
    """A directional follow relationship (follower -> followee)."""

    model_config = ConfigDict(from_attributes=True)

    follower: ProfileSummary
    followee: ProfileSummary
    created_at: datetime


def get_profile_or_404(db: Session, profile_id: uuid.UUID) -> Profile:
    profile = db.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Profile {profile_id} not found")
    return profile


def resolve_profile(db: Session, ident: str) -> Profile:
    """Resolve a profile from either a UUID string or a name (first match)."""
    try:
        return get_profile_or_404(db, uuid.UUID(ident))
    except ValueError:
        pass  # not a UUID — fall through to name lookup
    profile = db.query(Profile).filter(Profile.name == ident).first()
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Profile '{ident}' not found")
    return profile
