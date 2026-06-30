"""Recipes endpoints — GET (single), LIST, POST, DELETE.

A Recipe is parameterized by `ingredients`, `steps` (the procedure) and `cuisine`
(the "input" parameters), and owns a list of Reviews. SKELETON: returns mock data.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field

from app.common import CURRENT_USER, ProfileSummary, mock_now, mock_profile
from app.routers.reviews import ReviewOut, mock_review

router = APIRouter(prefix="/recipes", tags=["recipes"])


# ---- Schemas ---------------------------------------------------------------

class RecipeBase(BaseModel):
    title: str
    cuisine: Optional[str] = None                       # "type of cuisine" parameter
    ingredients: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)      # the procedure


class RecipeCreate(RecipeBase):
    """Fields the author supplies on create."""


class RecipeOut(RecipeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author: ProfileSummary
    review_count: int = 0
    avg_stars: Optional[float] = None
    created_at: datetime


class RecipeDetail(RecipeOut):
    """Single-recipe view: includes the embedded reviews."""

    reviews: List[ReviewOut] = Field(default_factory=list)


# ---- Mock helpers (replace with DB queries) --------------------------------

def mock_recipe(recipe_id: int, author: str = "sample_user") -> RecipeOut:
    return RecipeOut(
        id=recipe_id,
        title=f"Sample Recipe {recipe_id}",
        cuisine="Italian",
        ingredients=["200g pasta", "2 cloves garlic", "olive oil"],
        steps=["Boil the pasta.", "Sauté the garlic.", "Combine and serve."],
        author=mock_profile(author),
        review_count=2,
        avg_stars=4.5,
        created_at=mock_now(),
    )


# ---- Endpoints -------------------------------------------------------------

@router.get("", response_model=List[RecipeOut])
def list_recipes(
    skip: int = 0,
    limit: int = Query(default=10, le=100),
    cuisine: Optional[str] = None,
    author: Optional[str] = None,
):
    """LIST recipes, newest-first, with optional cuisine/author filters."""
    return [mock_recipe(i + 1) for i in range(min(limit, 3))]


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(recipe_id: int):
    """GET a single recipe with its reviews."""
    base = mock_recipe(recipe_id)
    return RecipeDetail(
        **base.model_dump(),
        reviews=[mock_review(1, recipe_id), mock_review(2, recipe_id)],
    )


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(payload: RecipeCreate):
    """POST a new recipe authored by the current user."""
    return RecipeOut(
        id=1,
        author=mock_profile(CURRENT_USER),
        review_count=0,
        avg_stars=None,
        created_at=mock_now(),
        **payload.model_dump(),
    )


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: int):
    """DELETE a recipe (must be owned by the current user once auth lands)."""
    if recipe_id <= 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return None
