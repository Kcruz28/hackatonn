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
from app.deps import get_current_user
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


class ProfileDetail(ProfileSummary):
    created_at: datetime
    stats: ProfileStats
    recipes: List[RecipeOut]


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


# ---- Helpers ---------------------------------------------------------------

def _count(db: Session, model, *conds) -> int:
    return db.query(func.count()).select_from(model).filter(*conds).scalar() or 0


def _detail(db: Session, profile: Profile) -> ProfileDetail:
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
        created_at=profile.created_at,
        stats=stats,
        recipes=[_to_out(r, *agg.get(r.recipe_id, (0, None))) for r in recipes],
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
    return _detail(db, current)


@router.patch("/me", response_model=ProfileSummary)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current: Profile = Depends(get_current_user),
):
    """PATCH the caller's profile (name and/or avatar_url)."""
    data = payload.model_dump(exclude_unset=True)
    new_name = data.get("name")
    if new_name and new_name != current.name:
        if db.query(Profile).filter(Profile.name == new_name).first():
            raise HTTPException(status_code=409, detail="Username already taken")
        current.name = new_name
    if "avatar_url" in data:
        current.avatar_url = data["avatar_url"]
    db.commit()
    db.refresh(current)
    return current


@router.get("/{username}", response_model=ProfileDetail)
def get_profile(username: str, db: Session = Depends(get_db)):
    """GET a public profile by username (or UUID) + stats + recipes. (Public)"""
    return _detail(db, resolve_profile(db, username))
