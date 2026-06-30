// Mirrors the FastAPI backend response shapes (backend/app/routers/*.py).
// Keep field names identical to the Pydantic models.

export interface ProfileSummary {
  profile_id: string;
  name: string;
  avatar_url: string | null;
}

export interface BackendRecipe {
  recipe_id: string;
  title: string;
  budget: string | null;
  ingredients: string | null;
  steps: string | null;
  image_url: string | null;
  author: ProfileSummary | null;
  rating: number | null;
  saves: number | null;
  review_count: number;
  avg_stars: number | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string | null;
  profile: ProfileSummary;
}

export interface RecipeCreate {
  title: string;
  budget?: string | null;
  ingredients?: string | null;
  steps?: string | null;
  image_url?: string | null;
}
