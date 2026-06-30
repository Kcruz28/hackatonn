"""Shared Pydantic models and mock helpers for the profile/social endpoints.

NOTE — this is a SKELETON. Every endpoint returns mock data and persists nothing.
The contract (field names + response shapes) is the real deliverable: the frontend
codes against these, and the database team swaps the `mock_*` helpers below for real
SQLAlchemy queries (behind a `get_db` dependency) without changing the shapes.

Identity convention: a Profile is identified by its `name` (username) in URLs,
per the agreed schema. There is no auth layer yet, so writes assume a placeholder
"current user" (`CURRENT_USER`); wire this to `get_current_user` when auth lands.
"""
from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict

# Placeholder for the authenticated caller until JWT auth is wired in.
CURRENT_USER = "me"


def mock_now() -> datetime:
    """A timestamp for fabricated responses."""
    return datetime.now(timezone.utc)


class ProfileSummary(BaseModel):
    """Lightweight reference to a Profile, used wherever one profile points at
    another (recipe author, review author, friend, follower, following)."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    avatar_url: str | None = None


def mock_profile(name: str = "sample_user") -> ProfileSummary:
    return ProfileSummary(name=name, avatar_url=None)


class FollowEdge(BaseModel):
    """A directional follow relationship (follower -> following).

    Shared by the /followers and /following routers, which are two views of the
    same edge: `/following?profile=X` lists edges where X is the follower,
    `/followers?profile=X` lists edges where X is the one being followed.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    follower: ProfileSummary
    following: ProfileSummary
    created_at: datetime
