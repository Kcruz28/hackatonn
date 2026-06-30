"""Friends endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase.

MUTUAL friendship. `friendships` is (user_a, user_b, created_at)
with a composite PK and no status column, so a friendship is a single row. The
pair is normalized (smaller UUID first) so it's stored once regardless of who
initiated. For writes the caller is one side (taken from the token). Listing is public.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.common import ProfileSummary, get_profile_or_404, resolve_profile
from app.database import get_db
from app.deps import get_current_user
from app.models import Friendship, Profile

router = APIRouter(prefix="/friends", tags=["friends"])


class FriendCreate(BaseModel):
    friend_id: uuid.UUID                    # the other side (caller is implicit)


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
    """LIST a profile's friends (returns the other side of each friendship). (Public)"""
    pid = resolve_profile(db, profile).profile_id
    rows = (
        db.query(Friendship)
        .filter(or_(Friendship.user_a == pid, Friendship.user_b == pid))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [r.profile_b if r.user_a == pid else r.profile_a for r in rows]


@router.get("/{friend_id}", response_model=FriendshipOut)
def get_friendship(
    friend_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """GET the friendship between the caller and `friend_id`."""
    friendship = db.get(Friendship, _norm(current.profile_id, friend_id))
    if friendship is None:
        raise HTTPException(status_code=404, detail="Friendship not found")
    return friendship


@router.post("", response_model=FriendshipOut, status_code=status.HTTP_201_CREATED)
def create_friendship(
    payload: FriendCreate,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """POST — connect the caller with `friend_id` (mutual)."""
    if payload.friend_id == current.profile_id:
        raise HTTPException(status_code=400, detail="Cannot befriend yourself")
    get_profile_or_404(db, payload.friend_id)
    a, b = _norm(current.profile_id, payload.friend_id)
    friendship = Friendship(user_a=a, user_b=b)
    db.add(friendship)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already friends")
    db.refresh(friendship)
    return friendship


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friendship(
    friend_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """DELETE — remove the connection between the caller and `friend_id`."""
    friendship = db.get(Friendship, _norm(current.profile_id, friend_id))
    if friendship is None:
        raise HTTPException(status_code=404, detail="Friendship not found")
    db.delete(friendship)
    db.commit()
    return None
