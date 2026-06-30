"""Followers endpoints — GET (single), LIST, DELETE. Wired to Supabase.

Directional mirror of /following: the profiles that follow a user. Listing is
public. There is no POST here — you can't make someone follow you; a follower is
created when *they* call POST /following. The caller can inspect or remove their
own followers (caller = followee).
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.common import FollowEdge, resolve_profile
from app.database import get_db
from app.deps import get_current_user
from app.models import Follow, Profile

router = APIRouter(prefix="/followers", tags=["followers"])


@router.get("", response_model=List[FollowEdge])
def list_followers(
    profile: str = Query(description="Whose followers to list (UUID or name)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """LIST the profiles that follow `profile`. (Public)"""
    pid = resolve_profile(db, profile).profile_id
    return db.query(Follow).filter(Follow.followee_id == pid).offset(skip).limit(limit).all()


@router.get("/{follower_id}", response_model=FollowEdge)
def get_follower(
    follower_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """GET whether `follower_id` follows the caller."""
    edge = db.get(Follow, (follower_id, current.profile_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Not a follower")
    return edge


@router.delete("/{follower_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_follower(
    follower_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """DELETE — the caller removes `follower_id` from their followers."""
    edge = db.get(Follow, (follower_id, current.profile_id))
    if edge is None:
        raise HTTPException(status_code=404, detail="Not a follower")
    db.delete(edge)
    db.commit()
    return None
