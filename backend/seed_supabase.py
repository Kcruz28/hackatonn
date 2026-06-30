import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
AUTHOR_ID = os.getenv("AUTHOR_ID")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

with open("recipes.json", "r", encoding="utf-8") as file:
    recipes = json.load(file)

rows = []

for recipe in recipes:
    row = {
        #"author_id": AUTHOR_ID,
        "title": recipe.get("title") or recipe.get("name"),
        "ingredients": "\n".join(recipe.get("ingredients", [])),
        "steps": "\n".join(recipe.get("instructions", [])),
        "image_url": recipe.get("image_url"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "rating": int(round(float(recipe.get("rating")))) if recipe.get("rating") else None,
        "budget": recipe.get("budget"),
        "saves": int(recipe.get("saves", 0)),
    }

    rows.append(row)

response = supabase.table("recipes").insert(rows).execute()

print(f"Inserted {len(rows)} recipes into Supabase.")