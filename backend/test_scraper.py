import json
import random
import time
from app.services.scraper import scrape_recipe
from seed.recipe_urls import RECIPE_URLS

all_recipes = []

for url in RECIPE_URLS:
    scraped = scrape_recipe(url)

    if "error" in scraped:
        print(f"Failed: {url}")
        continue

    final_recipe = {
        "name": scraped.get("title"),
        "title": scraped.get("title"),
        "rating": float(scraped["rating"]) if scraped.get("rating") else None,
        "review_count": int(scraped["review_count"]) if scraped.get("review_count") else None,
        "prep_time": scraped.get("prep_time"),
        "cook_time": scraped.get("cook_time"),
        "total_time": scraped.get("total_time"),
        "difficulty": random.randint(2, 8),
        "budget": random.choice(["$", "$$", "$$$"]),
        "saves": random.randint(100, 3000),
        "preview": scraped.get("description"),
        "image_url": scraped.get("image_url"),
        "ingredients": scraped.get("ingredients"),
        "instructions": scraped.get("instructions"),
        "source_url": scraped.get("source_url"),
    }

    all_recipes.append(final_recipe)
    time.sleep(2)

with open("recipes.json", "w", encoding="utf-8") as file:
    json.dump(all_recipes, file, indent=2, ensure_ascii=False)

print(f"Saved {len(all_recipes)} recipes to recipes.json")