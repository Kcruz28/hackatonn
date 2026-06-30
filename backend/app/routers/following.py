"""Following endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase.

Directional: the profiles a user follows. For writes the caller is always the
follower (taken from the token); they pass only the target (`followee_id`).
Listing is public. Mirror of /followers.
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
from app.deps import get_current_user
from app.models import Follow, Profile

router = APIRouter(prefix="/following", tags=["following"])


class FollowCreate(BaseModel):
    followee_id: uuid.UUID                  # who to follow (follower = caller)


@router.get("", response_model=List[FollowEdge])
def list_following(
    profile: str = Query(description="Whose following list (UUID or name)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """LIST the profiles that `profile` follows. (Public)"""
    pid = resolve_profile(db, profile).profile_id
    return db.query(Follow).filter(Follow.follower_id == pid).offset(skip).limit(limit).all()


@router.get("/{followee_id}", response_model=FollowEdge)
def get_following(
    followee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """GET whether the caller follows `followee_id`."""
    edge = db.get(Follow, (current.profile_id, followee_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Not following")
    return edge


@router.post("", response_model=FollowEdge, status_code=status.HTTP_201_CREATED)
def follow(
    payload: FollowCreate,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """POST — the caller starts following `followee_id`."""
    if payload.followee_id == current.profile_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    get_profile_or_404(db, payload.followee_id)
    edge = Follow(follower_id=current.profile_id, followee_id=payload.followee_id)
    db.add(edge)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already following")
    db.refresh(edge)
    return edge


@router.delete("/{followee_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow(
    followee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """DELETE — the caller unfollows `followee_id`."""
    edge = db.get(Follow, (current.profile_id, followee_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Not following")
    db.delete(edge)
    db.commit()
    return None
