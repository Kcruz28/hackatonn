"""Profiles endpoints — LIST, GET (me / by username), PATCH (me). Wired to Supabase.

A profile page shows the profile fields, computed social/recipe stats, and the
user's authored recipes. Profiles are created at signup (see /auth), so there is
no POST here. Editing is limited to `name` and `avatar_url` (the DB has no bio).
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.common import ProfileSummary, resolve_profile
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models import Follow, Friendship, Profile, Recipe, Review
from app.routers.recipes import RecipeOut, _aggregates, _to_out

router = APIRouter(prefix="/profiles", tags=["profiles"])


# ---- Schemas ---------------------------------------------------------------

class ProfileStats(BaseModel):
    recipe_count: int
    review_count: int
    follower_count: int
    following_count: int
    friend_count: int


class ViewerContext(BaseModel):
    """The authenticated caller's relationship to the profile being viewed.
    Null when the request is unauthenticated."""

    is_me: bool
    am_i_following: bool
    follows_me: bool
    are_we_friends: bool


class ProfileDetail(ProfileSummary):
    bio: Optional[str] = None
    created_at: datetime
    stats: ProfileStats
    recipes: List[RecipeOut]
    viewer: Optional[ViewerContext] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


# ---- Helpers ---------------------------------------------------------------

def _count(db: Session, model, *conds) -> int:
    return db.query(func.count()).select_from(model).filter(*conds).scalar() or 0


def _norm(a: uuid.UUID, b: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    return (a, b) if str(a) < str(b) else (b, a)


def _viewer_context(db: Session, profile: Profile, viewer: Optional[Profile]) -> Optional[ViewerContext]:
    if viewer is None:
        return None
    pid, vid = profile.profile_id, viewer.profile_id
    if vid == pid:
        return ViewerContext(is_me=True, am_i_following=False, follows_me=False, are_we_friends=False)
    return ViewerContext(
        is_me=False,
        am_i_following=db.get(Follow, (vid, pid)) is not None,
        follows_me=db.get(Follow, (pid, vid)) is not None,
        are_we_friends=db.get(Friendship, _norm(vid, pid)) is not None,
    )


def _detail(db: Session, profile: Profile, viewer: Optional[Profile] = None) -> ProfileDetail:
    pid = profile.profile_id
    stats = ProfileStats(
        recipe_count=_count(db, Recipe, Recipe.author_id == pid),
        review_count=_count(db, Review, Review.author_id == pid),
        follower_count=_count(db, Follow, Follow.followee_id == pid),
        following_count=_count(db, Follow, Follow.follower_id == pid),
        friend_count=_count(db, Friendship, or_(Friendship.user_a == pid, Friendship.user_b == pid)),
    )
    recipes = (
        db.query(Recipe).filter(Recipe.author_id == pid).order_by(Recipe.created_at.desc()).all()
    )
    agg = _aggregates(db, [r.recipe_id for r in recipes])
    return ProfileDetail(
        profile_id=pid,
        name=profile.name,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        created_at=profile.created_at,
        stats=stats,
        recipes=[_to_out(r, *agg.get(r.recipe_id, (0, None))) for r in recipes],
        viewer=_viewer_context(db, profile, viewer),
    )


# ---- Endpoints -------------------------------------------------------------

@router.get("", response_model=List[ProfileSummary])
def list_profiles(
    q: Optional[str] = Query(default=None, description="Case-insensitive name search"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """LIST profiles, optionally filtered by name. (Public)"""
    query = db.query(Profile).order_by(Profile.created_at.desc())
    if q:
        query = query.filter(Profile.name.ilike(f"%{q}%"))
    return query.offset(skip).limit(limit).all()


@router.get("/me", response_model=ProfileDetail)
def get_my_profile(db: Session = Depends(get_db), current: Profile = Depends(get_current_user)):
    """GET the authenticated caller's own profile + stats + recipes."""
    return _detail(db, current, viewer=current)


@router.patch("/me", response_model=ProfileDetail)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """PATCH the caller's profile (name, avatar_url and/or bio)."""
    data = payload.model_dump(exclude_unset=True)
    new_name = data.get("name")
    if new_name and new_name != current.name:
        if db.query(Profile).filter(Profile.name == new_name).first():
            raise HTTPException(status_code=409, detail="Username already taken")
        current.name = new_name
    if "avatar_url" in data:
        current.avatar_url = data["avatar_url"]
    if "bio" in data:
        current.bio = data["bio"]
    db.commit()
    db.refresh(current)
    return _detail(db, current, viewer=current)


@router.get("/{username}", response_model=ProfileDetail)
def get_profile(
    username: str,
    db: Session = Depends(get_db),
    viewer: Optional[Profile] = Depends(get_current_user_optional),
):
    """GET a public profile by username (or UUID) + stats + recipes.

    Public, but when a valid token is sent, `viewer` carries the caller's
    relationship to this profile (is_me / following / followed-by / friends)."""
    return _detail(db, resolve_profile(db, username), viewer=viewer)
