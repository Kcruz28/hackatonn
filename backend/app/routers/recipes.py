"""Recipes endpoints — GET (single), LIST, POST, DELETE. Wired to Supabase."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.common import ProfileSummary, get_profile_or_404, resolve_profile
from app.database import get_db
from app.models import Recipe, Review
from app.routers.reviews import ReviewOut

router = APIRouter(prefix="/recipes", tags=["recipes"])


# ---- Schemas ---------------------------------------------------------------

class RecipeBase(BaseModel):
    title: str
    cuisine: Optional[str] = None
    ingredients: Optional[str] = None       # free text (e.g. newline-separated)
    steps: Optional[str] = None             # free text (the procedure)
    image_url: Optional[str] = None


class RecipeCreate(RecipeBase):
    author_id: uuid.UUID                    # FK -> profiles (no auth yet)


class RecipeOut(RecipeBase):
    model_config = ConfigDict(from_attributes=True)

    recipe_id: uuid.UUID
    author: ProfileSummary
    review_count: int = 0
    avg_stars: Optional[float] = None
    created_at: datetime


class RecipeDetail(RecipeOut):
    reviews: List[ReviewOut] = Field(default_factory=list)


# ---- Helpers ---------------------------------------------------------------

def _aggregates(db: Session, recipe_ids: List[uuid.UUID]) -> dict[uuid.UUID, tuple[int, Optional[float]]]:
    """Map recipe_id -> (review_count, avg_stars) for a set of recipes."""
    if not recipe_ids:
        return {}
    rows = (
        db.query(Review.recipe_id, func.count().label("c"), func.avg(Review.stars).label("a"))
        .filter(Review.recipe_id.in_(recipe_ids))
        .group_by(Review.recipe_id)
        .all()
    )
    return {r.recipe_id: (r.c, float(r.a) if r.a is not None else None) for r in rows}


def _to_out(recipe: Recipe, count: int, avg: Optional[float]) -> RecipeOut:
    return RecipeOut(
        recipe_id=recipe.recipe_id,
        title=recipe.title,
        cuisine=recipe.cuisine,
        ingredients=recipe.ingredients,
        steps=recipe.steps,
        image_url=recipe.image_url,
        author=ProfileSummary.model_validate(recipe.author),
        review_count=count,
        avg_stars=avg,
        created_at=recipe.created_at,
    )


# ---- Endpoints -------------------------------------------------------------

@router.get("", response_model=List[RecipeOut])
def list_recipes(
    skip: int = 0,
    limit: int = Query(default=10, le=100),
    cuisine: Optional[str] = None,
    author: Optional[str] = Query(default=None, description="Filter by author UUID or name"),
    db: Session = Depends(get_db),
):
    """LIST recipes, newest-first, with optional cuisine/author filters."""
    q = db.query(Recipe).order_by(Recipe.created_at.desc())
    if cuisine:
        q = q.filter(Recipe.cuisine == cuisine)
    if author:
        q = q.filter(Recipe.author_id == resolve_profile(db, author).profile_id)
    recipes = q.offset(skip).limit(limit).all()
    agg = _aggregates(db, [r.recipe_id for r in recipes])
    return [_to_out(r, *agg.get(r.recipe_id, (0, None))) for r in recipes]


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(recipe_id: uuid.UUID, db: Session = Depends(get_db)):
    """GET a single recipe with its reviews and aggregate rating."""
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    count, avg = _aggregates(db, [recipe_id]).get(recipe_id, (0, None))
    reviews = (
        db.query(Review).filter(Review.recipe_id == recipe_id).order_by(Review.created_at.desc()).all()
    )
    base = _to_out(recipe, count, avg)
    return RecipeDetail(**base.model_dump(), reviews=[ReviewOut.model_validate(rv) for rv in reviews])


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(payload: RecipeCreate, db: Session = Depends(get_db)):
    """POST a new recipe. `author_id` must reference an existing profile."""
    get_profile_or_404(db, payload.author_id)  # 404 instead of FK IntegrityError
    recipe = Recipe(**payload.model_dump())
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return _to_out(recipe, 0, None)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: uuid.UUID, db: Session = Depends(get_db)):
    """DELETE a recipe (ownership check belongs here once auth lands)."""
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return None
