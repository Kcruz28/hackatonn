"""Following endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase.

Directional: the profiles a given profile follows. Backed by the `follows` table
(follower_id, followee_id, created_at), composite PK. Mirror of /followers.
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.common import FollowEdge, get_profile_or_404, resolve_profile
from app.database import get_db
from app.models import Follow

router = APIRouter(prefix="/following", tags=["following"])


class FollowCreate(BaseModel):
    follower_id: uuid.UUID
    followee_id: uuid.UUID


@router.get("", response_model=List[FollowEdge])
def list_following(
    profile: str = Query(description="Whose following list (UUID or name)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """LIST the profiles that `profile` follows."""
    pid = resolve_profile(db, profile).profile_id
    return (
        db.query(Follow).filter(Follow.follower_id == pid).offset(skip).limit(limit).all()
    )


@router.get("/{follower_id}/{followee_id}", response_model=FollowEdge)
def get_following(follower_id: uuid.UUID, followee_id: uuid.UUID, db: Session = Depends(get_db)):
    """GET a single follow edge."""
    edge = db.get(Follow, (follower_id, followee_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Follow not found")
    return edge


@router.post("", response_model=FollowEdge, status_code=status.HTTP_201_CREATED)
def follow(payload: FollowCreate, db: Session = Depends(get_db)):
    """POST — `follower_id` starts following `followee_id`."""
    if payload.follower_id == payload.followee_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    get_profile_or_404(db, payload.follower_id)
    get_profile_or_404(db, payload.followee_id)
    edge = Follow(follower_id=payload.follower_id, followee_id=payload.followee_id)
    db.add(edge)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already following")
    db.refresh(edge)
    return edge


@router.delete("/{follower_id}/{followee_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow(follower_id: uuid.UUID, followee_id: uuid.UUID, db: Session = Depends(get_db)):
    """DELETE — `follower_id` unfollows `followee_id`."""
    edge = db.get(Follow, (follower_id, followee_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Follow not found")
    db.delete(edge)
    db.commit()
    return None
