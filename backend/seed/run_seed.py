"""Seed the recipes table from scraped AllRecipes data (backend/recipes.json).

Run from the backend/ directory:  python -m seed.run_seed

Idempotent: reuses the single "AllRecipes" seed author and skips any recipe
whose title already exists, so re-running is safe.
"""
from __future__ import annotations

import json
import secrets
import uuid
from pathlib import Path

from app.database import SessionLocal
from app.models import Profile, Recipe
from app.supabase_client import admin_create_user

SEED_AUTHOR_NAME = "AllRecipes"
SEED_AUTHOR_EMAIL = "reci-seed@allrecipes.local"
RECIPES_JSON = Path(__file__).resolve().parent.parent / "recipes.json"


def _load_recipes() -> list[dict]:
    """recipes.json has stdout noise ('Scraping ...') before the JSON array,
    and may be UTF-16 (BOM) from a PowerShell redirect."""
    data = RECIPES_JSON.read_bytes()
    if data[:2] in (b"\xff\xfe", b"\xfe\xff"):
        raw = data.decode("utf-16")
    else:
        raw = data.decode("utf-8-sig")
    return json.loads(raw[raw.index("["):])


def _get_or_create_seed_author(db) -> Profile:
    author = db.query(Profile).filter(Profile.name == SEED_AUTHOR_NAME).first()
    if author is not None:
        return author
    # A real Supabase auth user guarantees a valid profile_id (FK to auth.users).
    user = admin_create_user(SEED_AUTHOR_EMAIL, secrets.token_urlsafe(16), SEED_AUTHOR_NAME)
    author = Profile(profile_id=uuid.UUID(user["id"]), name=SEED_AUTHOR_NAME)
    db.add(author)
    db.commit()
    db.refresh(author)
    return author


def _rating_to_int(value) -> int | None:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def main() -> None:
    db = SessionLocal()
    try:
        author = _get_or_create_seed_author(db)
        inserted = 0
        for item in _load_recipes():
            title = item.get("title") or item.get("name")
            if not title:
                continue
            if db.query(Recipe).filter(Recipe.title == title).first():
                print(f"skip (exists): {title}")
                continue
            db.add(
                Recipe(
                    author_id=author.profile_id,
                    title=title,
                    ingredients="\n".join(item.get("ingredients") or []),
                    steps="\n".join(item.get("instructions") or []),
                    image_url=item.get("image_url"),
                    rating=_rating_to_int(item.get("rating")),
                    budget=item.get("budget"),
                    saves=item.get("saves"),
                )
            )
            inserted += 1
            print(f"insert: {title}")
        db.commit()
        print(f"\nDone. Inserted {inserted} recipe(s); seed author = {author.name}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
