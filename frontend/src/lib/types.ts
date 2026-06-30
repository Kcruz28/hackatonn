// Mirrors backend Pydantic schemas (UserOut / RecipeOut / CommentOut) and auth
// responses. Field names MUST stay identical to backend/app/schemas.py.

export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
  favorite_cuisine?: string | null;
  created_at: string;
}

export interface Recipe {
  id: number;
  author_id: number | null;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  servings: number | null;
  calories?: number | null;
  difficulty: string;
  budget: string;
  cuisine: string;
  tags: string[];
  image_url: string | null;
  source_url?: string | null;
  is_seed: boolean;
  created_at: string;
  author: User | null;
  // Aggregates (optional; present on detail / list responses)
  avg_rating?: number | null;
  rating_count?: number;
  like_count?: number;
  save_count?: number;
  // Per-caller state (present when request is authenticated)
  liked_by_me?: boolean;
  saved_by_me?: boolean;
  my_rating?: number | null;
}

export interface Comment {
  id: number;
  body: string;
  author: User;
  parent_id: number | null;
  like_count: number;
  created_at: string;
  replies: Comment[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
