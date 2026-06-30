"""Following endpoints — GET (single), LIST, POST, DELETE.

Directional (LinkedIn/Instagram-style): "following" is the set of profiles the
current user (or a given profile) follows. Creating one = follow; deleting = unfollow.
Shares the `FollowEdge` shape with the /followers router. SKELETON: returns mock data.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.common import CURRENT_USER, FollowEdge, mock_now, mock_profile

router = APIRouter(prefix="/following", tags=["following"])


class FollowCreate(BaseModel):
    target_name: str                                    # username to follow


def mock_following_edge(edge_id: int, follower: str, following: str) -> FollowEdge:
    return FollowEdge(
        id=edge_id,
        follower=mock_profile(follower),
        following=mock_profile(following),
        created_at=mock_now(),
    )


@router.get("", response_model=List[FollowEdge])
def list_following(
    profile: Optional[str] = Query(default=None, description="Whose following list (defaults to current user)"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    """LIST the profiles that `profile` follows."""
    follower = profile or CURRENT_USER
    return [mock_following_edge(i + 1, follower, f"followed_{i + 1}") for i in range(min(limit, 3))]


@router.get("/{edge_id}", response_model=FollowEdge)
def get_following(edge_id: int):
    """GET a single follow edge."""
    return mock_following_edge(edge_id, CURRENT_USER, "sample_user")


@router.post("", response_model=FollowEdge, status_code=status.HTTP_201_CREATED)
def follow(payload: FollowCreate):
    """POST — the current user follows `target_name`."""
    if payload.target_name == CURRENT_USER:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    return mock_following_edge(1, CURRENT_USER, payload.target_name)


@router.delete("/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow(edge_id: int):
    """DELETE — the current user unfollows (removes the follow edge)."""
    if edge_id <= 0:
        raise HTTPException(status_code=404, detail="Follow edge not found")
    return None
