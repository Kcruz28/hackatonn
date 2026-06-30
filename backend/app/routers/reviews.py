"""Reviews endpoints — GET (single), LIST, POST, DELETE.

A Review belongs to a recipe and carries `stars` (1-5), a `review` text body, and
`images`. SKELETON: returns mock data.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field

from app.common import CURRENT_USER, ProfileSummary, mock_now, mock_profile

router = APIRouter(prefix="/reviews", tags=["reviews"])


# ---- Schemas ---------------------------------------------------------------

class ReviewBase(BaseModel):
    stars: int = Field(ge=1, le=5)
    review: str = ""                                    # the text body
    images: List[str] = Field(default_factory=list)     # image URLs


class ReviewCreate(ReviewBase):
    recipe_id: int                                      # which recipe is reviewed


class ReviewOut(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipe_id: int
    author: ProfileSummary
    created_at: datetime


# ---- Mock helpers (replace with DB queries) --------------------------------

def mock_review(review_id: int, recipe_id: int = 1, author: str = "sample_user") -> ReviewOut:
    return ReviewOut(
        id=review_id,
        recipe_id=recipe_id,
        stars=5,
        review="Delicious — made it twice this week.",
        images=[],
        author=mock_profile(author),
        created_at=mock_now(),
    )


# ---- Endpoints -------------------------------------------------------------

@router.get("", response_model=List[ReviewOut])
def list_reviews(
    recipe_id: Optional[int] = Query(default=None, description="Filter to one recipe"),
    author: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
):
    """LIST reviews, optionally filtered by recipe or author."""
    return [mock_review(i + 1, recipe_id or 1) for i in range(min(limit, 2))]


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: int):
    """GET a single review."""
    return mock_review(review_id)


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate):
    """POST a review on a recipe, authored by the current user."""
    return ReviewOut(
        id=1,
        author=mock_profile(CURRENT_USER),
        created_at=mock_now(),
        **payload.model_dump(),
    )


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int):
    """DELETE a review (must be authored by the current user once auth lands)."""
    if review_id <= 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return None
