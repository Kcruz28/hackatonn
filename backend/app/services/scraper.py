import json
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def is_recipe(item):
    recipe_type = item.get("@type")
    return recipe_type == "Recipe" or (
        isinstance(recipe_type, list) and "Recipe" in recipe_type
    )


def scrape_recipe(url):
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    scripts = soup.find_all("script", type="application/ld+json")

    recipe_data = None

    for script in scripts:
        try:
            script_text = script.get_text(strip=True)
            if not script_text:
                continue

            data = json.loads(script_text)

            if isinstance(data, dict):
                if is_recipe(data):
                    recipe_data = data
                    break

                if "@graph" in data:
                    for item in data["@graph"]:
                        if isinstance(item, dict) and is_recipe(item):
                            recipe_data = item
                            break

            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and is_recipe(item):
                        recipe_data = item
                        break

        except Exception:
            continue

    if recipe_data is None:
        return {
            "error": "No recipe data found",
            "source_url": url
        }

    instructions = []
    for step in recipe_data.get("recipeInstructions", []):
        if isinstance(step, dict):
            text = step.get("text")
            if text:
                instructions.append(text)
        elif isinstance(step, str):
            instructions.append(step)

    image = recipe_data.get("image")
    if isinstance(image, list):
        image_url = image[0]
    elif isinstance(image, dict):
        image_url = image.get("url")
    else:
        image_url = image

    rating_data = recipe_data.get("aggregateRating", {})
    nutrition_data = recipe_data.get("nutrition", {})

    return {
        "title": recipe_data.get("name"),
        "description": recipe_data.get("description"),
        "ingredients": recipe_data.get("recipeIngredient", []),
        "instructions": instructions,
        "prep_time": recipe_data.get("prepTime"),
        "cook_time": recipe_data.get("cookTime"),
        "total_time": recipe_data.get("totalTime"),
        "servings": recipe_data.get("recipeYield"),
        "rating": rating_data.get("ratingValue") if isinstance(rating_data, dict) else None,
        "review_count": rating_data.get("reviewCount") if isinstance(rating_data, dict) else None,
        "calories": nutrition_data.get("calories") if isinstance(nutrition_data, dict) else None,
        "image_url": image_url,
        "source_url": url,
        "source": "AllRecipes"
    }