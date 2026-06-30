"""Followers endpoints — GET (single), LIST, POST, DELETE.

Directional: "followers" is the set of profiles that follow a given profile — the
mirror view of /following over the same `FollowEdge`. You normally GAIN a follower
when someone else follows you (see POST /following), so POST here is provided for
contract symmetry; the everyday actions are LIST (who follows me) and DELETE
(remove a follower). SKELETON: returns mock data.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.common import CURRENT_USER, FollowEdge, mock_now, mock_profile

router = APIRouter(prefix="/followers", tags=["followers"])


class FollowerCreate(BaseModel):
    follower_name: str                                  # username that follows the profile


def mock_follower_edge(edge_id: int, follower: str, following: str) -> FollowEdge:
    return FollowEdge(
        id=edge_id,
        follower=mock_profile(follower),
        following=mock_profile(following),
        created_at=mock_now(),
    )


@router.get("", response_model=List[FollowEdge])
def list_followers(
    profile: Optional[str] = Query(default=None, description="Whose followers to list (defaults to current user)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    """LIST the profiles that follow `profile`."""
    following = profile or CURRENT_USER
    return [mock_follower_edge(i + 1, f"follower_{i + 1}", following) for i in range(min(limit, 3))]


@router.get("/{edge_id}", response_model=FollowEdge)
def get_follower(edge_id: int):
    """GET a single follower edge."""
    return mock_follower_edge(edge_id, "sample_user", CURRENT_USER)


@router.post("", response_model=FollowEdge, status_code=status.HTTP_201_CREATED)
def add_follower(payload: FollowerCreate):
    """POST — record that `follower_name` follows the current user (symmetry with /following)."""
    if payload.follower_name == CURRENT_USER:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    return mock_follower_edge(1, payload.follower_name, CURRENT_USER)


@router.delete("/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_follower(edge_id: int):
    """DELETE — remove a follower (drops the follow edge)."""
    if edge_id <= 0:
        raise HTTPException(status_code=404, detail="Follower edge not found")
    return None
