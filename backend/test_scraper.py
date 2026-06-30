import json
import time
from app.services.scraper import scrape_recipe
from seed.approved_urls import APPROVED_RECIPES
import re

def format_time(iso_time):
    if not iso_time:
        return None

    hours = re.search(r"(\d+)H", iso_time)
    minutes = re.search(r"(\d+)M", iso_time)

    total = 0

    if hours:
        total += int(hours.group(1)) * 60

    if minutes:
        total += int(minutes.group(1))

    if total == 0:
        return None

    return f"{total} min"

all_recipes = []

for item in APPROVED_RECIPES:
    print(f"Scraping {item['name']}...")

    scraped = scrape_recipe(item["url"])

    final_recipe = {
    "name": item["name"],
    "title": scraped.get("title"),
    "rating": float(scraped["rating"]) if scraped.get("rating") else None,
    "review_count": int(scraped["review_count"]) if scraped.get("review_count") else None,
    "prep_time": format_time(scraped.get("prep_time")),
    "cook_time": format_time(scraped.get("cook_time")),
    "total_time": format_time(scraped.get("total_time")),
    "difficulty": item["difficulty"],
    "budget": item["budget"],
    "saves": item["saves"],
    "preview": scraped.get("description"),
    "image_url": scraped.get("image_url"),
    "ingredients": scraped.get("ingredients"),
    "instructions": scraped.get("instructions"),
    "source_url": scraped.get("source_url"),
}

    all_recipes.append(final_recipe)

    time.sleep(2)

print(json.dumps(all_recipes, indent=2))