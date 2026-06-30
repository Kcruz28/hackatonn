// Maps a backend recipe (Supabase) into the prototype's `Recipe` card shape.
// Real data: title, author, image, star rating (avg_stars or seeded rating),
// saves, review count. UI-only fields (tier, cuisine, tags, notes, time) are
// derived or placeholder so the rich card keeps its look.
import type { Recipe } from "@/app/components/app-data";
import type { BackendRecipe } from "@/lib/types";

const ENTITIES: Record<string, string> = {
  "&#39;": "'",
  "&#x27;": "'",
  "&quot;": '"',
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeHtml(value: string): string {
  return value.replace(/&#39;|&#x27;|&quot;|&amp;|&lt;|&gt;/g, (m) => ENTITIES[m] ?? m);
}

// Backend stars are 1-5 (avg_stars from reviews, else the seeded `rating`).
function fiveStar(b: BackendRecipe): number {
  if (b.avg_stars != null) return b.avg_stars;
  if (b.rating != null) return b.rating;
  return 0;
}

function tierFromStars(stars: number): Recipe["tier"] {
  if (stars >= 4.5) return "S";
  if (stars >= 4) return "A";
  if (stars >= 3) return "B";
  return "C";
}

const CUISINE_KEYWORDS: [RegExp, string][] = [
  [/pasta|vodka|gnocchi|alfredo/i, "Italian"],
  [/pizza|margherita/i, "Italian"],
  [/caesar|salad/i, "American"],
  [/butter chicken|makhani|tikka|curry|masala/i, "Indian"],
  [/fried rice|ramen|teriyaki|miso/i, "Asian"],
  [/taco|carne|asada|burrito|quesadilla/i, "Mexican"],
  [/falafel|hummus|shawarma/i, "Mediterranean"],
  [/greek|tzatziki|gyro/i, "Greek"],
];

function cuisineFromTitle(title: string): string {
  for (const [re, label] of CUISINE_KEYWORDS) {
    if (re.test(title)) return label;
  }
  return "Recipe";
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=48&h=48&fit=crop&auto=format";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&h=420&fit=crop&auto=format";

export function mapRecipe(b: BackendRecipe, index: number): Recipe {
  const stars = fiveStar(b);
  const title = decodeHtml(b.title);
  const cuisine = cuisineFromTitle(title);
  return {
    id: index + 1,
    backendId: b.recipe_id,
    ingredients: b.ingredients ? decodeHtml(b.ingredients) : undefined,
    steps: b.steps ? decodeHtml(b.steps) : undefined,
    name: title,
    author: b.author?.name ?? "AllRecipes",
    authorAvatar: b.author?.avatar_url || FALLBACK_AVATAR,
    cuisine,
    time: "30 min",
    image: b.image_url || FALLBACK_IMAGE,
    rating: Math.round(stars * 2 * 10) / 10, // 1-5 stars -> 0-10 display scale
    tier: tierFromStars(stars),
    notes: "A community favorite worth ranking.",
    likes: b.saves ?? 0,
    comments: b.review_count ?? 0,
    tags: [cuisine.toLowerCase(), ...(b.budget ? [b.budget] : [])],
    ranked: false,
  };
}
