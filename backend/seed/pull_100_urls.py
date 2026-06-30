import requests
from bs4 import BeautifulSoup

START_SITEMAP = "https://www.allrecipes.com/sitemap.xml"

HEADERS = {
    "User-Agent": "ReciStudentProject/1.0"
}


def get_soup(url):
    response = requests.get(url, headers=HEADERS, timeout=20)
    response.raise_for_status()
    return BeautifulSoup(response.text, "xml")


def pull_recipe_urls(limit=100):
    main_soup = get_soup(START_SITEMAP)

    sitemap_urls = [
        loc.text.strip()
        for loc in main_soup.find_all("loc")
        if "sitemap" in loc.text.lower()
    ]

    print(f"Found {len(sitemap_urls)} sitemap files")

    recipe_urls = []

    for sitemap_url in sitemap_urls:
        print(f"Checking: {sitemap_url}")

        try:
            soup = get_soup(sitemap_url)

            for loc in soup.find_all("loc"):
                url = loc.text.strip()

                if "allrecipes.com/recipe/" in url:
                    recipe_urls.append(url)

                if len(recipe_urls) >= limit:
                    return recipe_urls

        except Exception as e:
            print(f"Skipped {sitemap_url}: {e}")

    return recipe_urls


if __name__ == "__main__":
    urls = pull_recipe_urls(100)

    print(f"Found {len(urls)} recipe URLs")

    with open("seed/recipe_urls.py", "w", encoding="utf-8") as file:
        file.write("RECIPE_URLS = [\n")
        for url in urls:
            file.write(f'    "{url}",\n')
        file.write("]\n")

    print("Saved to seed/recipe_urls.py")