"""Friends endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase.

LinkedIn-style MUTUAL connection. The live `friendships` table is just
(user_a, user_b, created_at) with a composite PK and no status column, so a
connection is a single row. We normalize the pair (smaller UUID first) so a
friendship is stored once regardless of who initiated it.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.common import ProfileSummary, get_profile_or_404, resolve_profile
from app.database import get_db
from app.models import Friendship

router = APIRouter(prefix="/friends", tags=["friends"])


class FriendCreate(BaseModel):
    profile_id: uuid.UUID
    friend_id: uuid.UUID


class FriendshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    profile_a: ProfileSummary
    profile_b: ProfileSummary
    created_at: datetime


def _norm(a: uuid.UUID, b: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    """Order a pair deterministically so (a,b) and (b,a) map to one row."""
    return (a, b) if str(a) < str(b) else (b, a)


@router.get("", response_model=List[ProfileSummary])
def list_friends(
    profile: str = Query(description="Whose friends to list (UUID or name)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """LIST a profile's friends (returns the other side of each connection)."""
    pid = resolve_profile(db, profile).profile_id
    rows = (
        db.query(Friendship)
        .filter(or_(Friendship.user_a == pid, Friendship.user_b == pid))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [r.profile_b if r.user_a == pid else r.profile_a for r in rows]


@router.get("/{profile_id}/{friend_id}", response_model=FriendshipOut)
def get_friendship(profile_id: uuid.UUID, friend_id: uuid.UUID, db: Session = Depends(get_db)):
    """GET a single friendship between two profiles."""
    a, b = _norm(profile_id, friend_id)
    friendship = db.get(Friendship, (a, b))
    if friendship is None:
        raise HTTPException(status_code=404, detail="Friendship not found")
    return friendship


@router.post("", response_model=FriendshipOut, status_code=status.HTTP_201_CREATED)
def create_friendship(payload: FriendCreate, db: Session = Depends(get_db)):
    """POST — connect two profiles (mutual)."""
    if payload.profile_id == payload.friend_id:
        raise HTTPException(status_code=400, detail="Cannot befriend yourself")
    get_profile_or_404(db, payload.profile_id)
    get_profile_or_404(db, payload.friend_id)
    a, b = _norm(payload.profile_id, payload.friend_id)
    friendship = Friendship(user_a=a, user_b=b)
    db.add(friendship)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already friends")
    db.refresh(friendship)
    return friendship


@router.delete("/{profile_id}/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friendship(profile_id: uuid.UUID, friend_id: uuid.UUID, db: Session = Depends(get_db)):
    """DELETE — remove a connection between two profiles."""
    a, b = _norm(profile_id, friend_id)
    friendship = db.get(Friendship, (a, b))
    if friendship is None:
        raise HTTPException(status_code=404, detail="Friendship not found")
    db.delete(friendship)
    db.commit()
    return None
