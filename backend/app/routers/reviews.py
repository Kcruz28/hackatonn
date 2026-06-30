"""Reviews endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase.

DB columns: stars (1-5), `comment` (text), single `image_url`. UNIQUE(author_id,
recipe_id) means one review per author per recipe (duplicate -> 409).
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.common import ProfileSummary, get_profile_or_404
from app.database import get_db
from app.models import Recipe, Review

router = APIRouter(prefix="/reviews", tags=["reviews"])


# ---- Schemas ---------------------------------------------------------------

class ReviewBase(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    image_url: Optional[str] = None


class ReviewCreate(ReviewBase):
    recipe_id: uuid.UUID
    author_id: uuid.UUID                    # FK -> profiles (no auth yet)


class ReviewOut(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    review_id: uuid.UUID
    recipe_id: uuid.UUID
    author: ProfileSummary
    created_at: datetime


# ---- Endpoints -------------------------------------------------------------

@router.get("", response_model=List[ReviewOut])
def list_reviews(
    recipe_id: Optional[uuid.UUID] = Query(default=None, description="Filter to one recipe"),
    author_id: Optional[uuid.UUID] = Query(default=None, description="Filter to one author"),
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    """LIST reviews, newest-first, optionally filtered by recipe or author."""
    q = db.query(Review).order_by(Review.created_at.desc())
    if recipe_id:
        q = q.filter(Review.recipe_id == recipe_id)
    if author_id:
        q = q.filter(Review.author_id == author_id)
    return q.offset(skip).limit(limit).all()


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: uuid.UUID, db: Session = Depends(get_db)):
    """GET a single review."""
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)):
    """POST a review on a recipe. One per (author, recipe) — duplicate -> 409."""
    get_profile_or_404(db, payload.author_id)
    if db.get(Recipe, payload.recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    review = Review(**payload.model_dump())
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already reviewed this recipe")
    db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: uuid.UUID, db: Session = Depends(get_db)):
    """DELETE a review (ownership check belongs here once auth lands)."""
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return None
