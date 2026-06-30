"""Followers endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase.

Directional: the profiles that follow a given profile — the mirror view of
/following over the same `follows` edge. You normally gain a follower when someone
else follows you (POST /following); POST here exists for contract symmetry.
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

router = APIRouter(prefix="/followers", tags=["followers"])


class FollowerCreate(BaseModel):
    follower_id: uuid.UUID                  # who is doing the following
    followee_id: uuid.UUID                  # the profile being followed


@router.get("", response_model=List[FollowEdge])
def list_followers(
    profile: str = Query(description="Whose followers to list (UUID or name)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """LIST the profiles that follow `profile`."""
    pid = resolve_profile(db, profile).profile_id
    return (
        db.query(Follow).filter(Follow.followee_id == pid).offset(skip).limit(limit).all()
    )


@router.get("/{follower_id}/{followee_id}", response_model=FollowEdge)
def get_follower(follower_id: uuid.UUID, followee_id: uuid.UUID, db: Session = Depends(get_db)):
    """GET a single follower edge."""
    edge = db.get(Follow, (follower_id, followee_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Follow not found")
    return edge


@router.post("", response_model=FollowEdge, status_code=status.HTTP_201_CREATED)
def add_follower(payload: FollowerCreate, db: Session = Depends(get_db)):
    """POST — record that `follower_id` follows `followee_id` (symmetry with /following)."""
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
def remove_follower(follower_id: uuid.UUID, followee_id: uuid.UUID, db: Session = Depends(get_db)):
    """DELETE — remove a follower (drops the follow edge)."""
    edge = db.get(Follow, (follower_id, followee_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Follow not found")
    db.delete(edge)
    db.commit()
    return None
