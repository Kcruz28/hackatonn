# Reci — MVP Build Tasks (6-Person Parallel Plan)

A granular, ordered task list for building the Reci MVP, **split across 6 engineers**. Each task is sized to hand to an engineering LLM one at a time, then test before moving on.

**Team:** Cindy · Archana · Avaya · Kevin · Kaavya · Adi

---

## How To Use This Document

**For each engineer:**
- You own the tasks tagged with your name. Work **top-to-bottom** through your lane.
- Give the LLM **one task at a time** — copy the task block, nothing else.
- After it finishes, run the **Test** step. Pass → move on. Fail → paste the failure back.
- Tasks have a **Blocked by** line. Do not start a task until its blockers are merged to `main`.
- `[STRETCH]` tasks get built only if your lane is ahead and the cut list (bottom) says so.

**For the engineering LLM:**
- Complete **only the single task given to you.** Do not implement future tasks or refactor unrelated files.
- When done, stop and report what changed and how to test it.
- Assume files from earlier tasks exist as specified.

**Conventions:**
- Backend in `backend/`, frontend in `frontend/`. Paths are repo-root relative.
- Each task: **Owner · Blocked by · Goal · Files · Steps · Test · Done when.**
- Branch names: `feature/<name>-<task>` e.g. `feature/cindy-3.3`. PR into `main`.

---

## Ownership Map (who owns what surface)

| Engineer | Lane | Owns |
|---|---|---|
| **Kaavya** | Design system + shared frontend | Next scaffold, Tailwind theme, shadcn, `RecipeCard`, nav, skeletons, API wrapper |
| **Cindy** | Auth (full stack) | Security helpers, auth schemas/routes, frontend auth pages, session |
| **Kevin** | Data backbone | DB engine, **all models**, table creation, scraper, seed data |
| **Avaya** | Recipes + interactions (full stack) | Recipe schemas/routes, like/save/rate, recipe detail + upload UI, interaction bar |
| **Archana** | Feeds + discovery (full stack) | Home feed, friends feed, For-You, search (back + front) |
| **Adi** | Social + leaderboard (full stack) | Follows, profiles, comments, leaderboard (back + front) |

**The two shared-file rules that prevent collisions:**
1. **`backend/app/models.py` is Kevin's.** Nobody else edits it. If you need a model changed, ping Kevin.
2. **`backend/app/main.py` (router registration) and `backend/app/schemas.py` are append-only and coordinated.** Each person appends their own schemas/router include in their own task; never rewrite someone else's block. Resolve conflicts by keeping both.

---

## Critical Path (do these first, in this order)

These unblock everyone. Treat the first ~2 hours as a sprint to clear them:

```
Kevin 1.1 → 1.2 → 1.3 (env, config, DB)        ─┐
Kaavya 0.1 (repo skeleton)                       ├─→ unblocks all backend
Kevin 2.1–2.5 (models + tables)                 ─┘
Kevin 5.1–5.3 (seed data)        ──→ unblocks all recipe UI
Kaavya 9.1–9.4 (frontend scaffold + api.ts)  ──→ unblocks all frontend
Kaavya 11.1 (RecipeCard)         ──→ unblocks all recipe rendering
```

Everyone else's Hour-1 job: read the architecture, stub your types, and wait on the Slack ping that 2.5 / 9.4 / 11.1 are merged.

---

# PHASE 0 — Repo Skeleton

### Task 0.1 — Create repo structure and gitignore
**Owner:** Kaavya
**Blocked by:** nothing
**Goal:** Empty but correct folder layout with a gitignore.
**Files:** `.gitignore`, `README.md`, `backend/.gitkeep`, `frontend/.gitkeep`
**Steps:**
1. Create top-level `backend/` and `frontend/` folders.
2. `.gitignore`: `__pycache__/`, `*.pyc`, `.env`, `venv/`, `node_modules/`, `.next/`, `.DS_Store`, `.env.local`.
3. One-paragraph `README.md` naming the project and folders.
**Test:** `ls -la backend frontend` shows both; `cat .gitignore` shows entries.
**Done when:** Structure + gitignore committed to `main`.

---

# PHASE 1 — Backend Foundation  (Kevin)

### Task 1.1 — Python env and dependencies
**Owner:** Kevin
**Blocked by:** 0.1
**Goal:** Installable backend with pinned deps.
**Files:** `backend/requirements.txt`, `backend/.env.example`
**Steps:**
1. `requirements.txt`: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `pydantic`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart`, `requests`, `beautifulsoup4`, `cloudinary`.
2. `.env.example` keys (no values): `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `FRONTEND_ORIGIN`.
**Test:** `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt` succeeds.
**Done when:** Deps install cleanly.

### Task 1.2 — Config loader
**Owner:** Kevin
**Blocked by:** 1.1
**Goal:** One typed settings object.
**Files:** `backend/app/__init__.py` (empty), `backend/app/config.py`
**Steps:**
1. `Settings` (pydantic-settings) exposing every `.env` key, reading from `.env`.
2. Export singleton `settings = Settings()`.
**Test:** With a dummy `.env`, `python -c "from app.config import settings; print(settings.JWT_ALGORITHM)"` prints the value.
**Done when:** `settings` imports and reads env.

### Task 1.3 — Database engine and session
**Owner:** Kevin
**Blocked by:** 1.2
**Goal:** Engine, session factory, Base, `get_db`.
**Files:** `backend/app/database.py`
**Steps:**
1. `engine` from `settings.DATABASE_URL`; `SessionLocal`; declarative `Base`.
2. `get_db()` generator yielding+closing a session.
**Test:** `python -c "from app.database import engine; print(engine.url)"` prints the URL (real Neon URL in `.env`).
**Done when:** Module imports, engine constructs.

### Task 1.4 — Minimal FastAPI app boots
**Owner:** Kevin
**Blocked by:** 1.3
**Goal:** Running server with health check + CORS.
**Files:** `backend/app/main.py`
**Steps:**
1. `FastAPI()` app; CORS allowing `settings.FRONTEND_ORIGIN` + `http://localhost:3000`.
2. `GET /health` → `{"status":"ok"}`.
**Test:** `uvicorn app.main:app --reload`, visit `/health` → ok; `/docs` loads.
**Done when:** Server boots, `/health` responds. **← Ping team: backend boots.**

---

# PHASE 2 — Data Models  (Kevin — the contract)

> Kevin owns `models.py` exclusively. Build all of Phase 2 before others wire routes.

### Task 2.1 — User model
**Owner:** Kevin · **Blocked by:** 1.4
**Goal:** `users` table.
**Files:** `backend/app/models.py`
**Steps:** `User`: `id`, `username` (unique), `email` (unique), `hashed_password`, `bio?`, `avatar_url?`, `favorite_cuisine?`, `created_at`.
**Test:** `python -c "from app.models import User; print(User.__tablename__)"` → `users`.
**Done when:** Model imports.

### Task 2.2 — Recipe model
**Owner:** Kevin · **Blocked by:** 2.1
**Goal:** `recipes` table with seed-attribution fields.
**Files:** `backend/app/models.py` (append)
**Steps:** `Recipe`: `id`, `author_id` (FK→users, **nullable**), `title`, `description`, `ingredients` (JSON), `instructions` (JSON), `prep_time`, `cook_time`, `total_time`, `servings`, `calories?`, `difficulty`, `budget`, `cuisine`, `tags` (JSON), `image_url`, `source_url?`, `is_seed` (bool default false), `created_at`.
**Test:** `python -c "from app.models import Recipe; print(Recipe.__tablename__)"` → `recipes`.
**Done when:** Model imports.

### Task 2.3 — Interaction models (ratings, likes, saves)
**Owner:** Kevin · **Blocked by:** 2.2
**Goal:** `ratings`, `likes`, `saves` with uniqueness.
**Files:** `backend/app/models.py` (append)
**Steps:** `Rating` (`score`, `UniqueConstraint(user_id, recipe_id)`); `Like`, `Save` (same unique-together shape).
**Test:** `python -c "from app.models import Rating, Like, Save; print('ok')"`.
**Done when:** All three import.

### Task 2.4 — Comment and Follow models
**Owner:** Kevin · **Blocked by:** 2.3
**Goal:** `comments` (self-nesting) + `follows` (directional).
**Files:** `backend/app/models.py` (append)
**Steps:** `Comment` (`parent_id` FK→comments nullable, `body`, `like_count` default 0); `Follow` (`follower_id`, `followed_id`, `UniqueConstraint`).
**Test:** `python -c "from app.models import Comment, Follow; print('ok')"`.
**Done when:** Both import.

### Task 2.5 — Create all tables
**Owner:** Kevin · **Blocked by:** 2.4
**Goal:** Tables exist in Postgres.
**Files:** `backend/create_tables.py`
**Steps:** Import `Base` + all models; `Base.metadata.create_all(bind=engine)`.
**Test:** `python create_tables.py`, then confirm in Neon console: `users`, `recipes`, `ratings`, `likes`, `saves`, `comments`, `follows`.
**Done when:** All 7 tables present. **← Ping team: schema is live, backend lanes unblocked.**

---

# PHASE 3 — Auth  (Cindy)

### Task 3.1 — Password hashing + JWT helpers
**Owner:** Cindy · **Blocked by:** 1.4
**Goal:** Security primitives.
**Files:** `backend/app/security.py`
**Steps:** `hash_password`/`verify_password` (passlib bcrypt); `create_access_token`/`decode_token` (python-jose + `settings.JWT_SECRET`).
**Test:** `python -c "from app.security import hash_password, verify_password; h=hash_password('x'); print(verify_password('x',h), verify_password('y',h))"` → `True False`.
**Done when:** Hash round-trips, token encodes/decodes.

### Task 3.2 — Auth schemas
**Owner:** Cindy · **Blocked by:** 2.1
**Goal:** Auth request/response shapes.
**Files:** `backend/app/schemas.py` (create or append)
**Steps:** `UserCreate`, `UserOut` (no password, `from_attributes=True`), `Token`, `LoginRequest`.
**Test:** `python -c "from app.schemas import UserCreate, UserOut, Token; print('ok')"`.
**Done when:** Schemas import.

### Task 3.3 — Signup endpoint
**Owner:** Cindy · **Blocked by:** 3.1, 3.2, 2.5
**Goal:** `POST /auth/signup` creates user + returns token.
**Files:** `backend/app/routers/auth.py`, append include to `main.py`
**Steps:** Hash password, insert `User`, return `{token, user}`; duplicate email/username → 400; include router.
**Test:** `/docs` POST `/auth/signup` new user → 200 + token; same again → 400.
**Done when:** Users persist, duplicates rejected.

### Task 3.4 — Login + get_current_user
**Owner:** Cindy · **Blocked by:** 3.3
**Goal:** `POST /auth/login` + reusable auth dependency.
**Files:** `backend/app/deps.py`, `backend/app/routers/auth.py` (append)
**Steps:** `login` verifies creds → `{token, user}` or 401; `get_current_user` decodes Bearer → `User` or 401; add `GET /auth/me`.
**Test:** Login → copy token → `GET /auth/me` with Bearer → your user; bad token → 401.
**Done when:** Login works, `/auth/me` protected. **← Ping team: `get_current_user` ready for other routes.**

---

# PHASE 4 — Recipes Core  (Avaya)

### Task 4.1 — Recipe schemas
**Owner:** Avaya · **Blocked by:** 2.2
**Goal:** Recipe shapes.
**Files:** `backend/app/schemas.py` (append)
**Steps:** `RecipeCreate` (user-supplied fields); `RecipeOut` (+ `id`, `created_at`, nested `author` UserOut|null, optional `avg_rating`, `rating_count`, `like_count`, `save_count`).
**Test:** `python -c "from app.schemas import RecipeCreate, RecipeOut; print('ok')"`.
**Done when:** Schemas import.

### Task 4.2 — Create recipe endpoint
**Owner:** Avaya · **Blocked by:** 4.1, 3.4
**Goal:** `POST /recipes` (auth) inserts recipe.
**Files:** `backend/app/routers/recipes.py`, append include to `main.py`
**Steps:** Use `get_current_user`; `author_id`=current, `is_seed=false`; `total_time=prep+cook` if absent; return `RecipeOut`.
**Test:** Auth POST `/recipes` → 200 with you as author; verify DB row.
**Done when:** Auth users create recipes.

### Task 4.3 — Get single recipe
**Owner:** Avaya · **Blocked by:** 4.2
**Goal:** `GET /recipes/{id}` with author + counts.
**Files:** `backend/app/routers/recipes.py` (append)
**Steps:** Fetch by id, join author, 404 if missing; compute `avg_rating`/`rating_count`/`like_count`/`save_count` via COUNT/AVG.
**Test:** `GET /recipes/1` → full object, counts 0; `GET /recipes/9999` → 404.
**Done when:** Single fetch works with live counts.

### Task 4.4 — List recipes (home feed) + pagination
**Owner:** Avaya · **Blocked by:** 4.3
**Goal:** `GET /recipes?skip&limit` newest-first.
**Files:** `backend/app/routers/recipes.py` (append)
**Steps:** Order `created_at desc`, apply `skip`/`limit` (0/10 defaults); return `list[RecipeOut]`.
**Test:** Make 3 recipes; `?skip=0&limit=2` → 2 newest; `?skip=2&limit=2` → 3rd.
**Done when:** Pagination slices correctly. **← Ping Archana: feed endpoint ready.**

### Task 4.5 — Featured recipes
**Owner:** Avaya · **Blocked by:** 4.4
**Goal:** `GET /recipes/featured` → seed only.
**Files:** `backend/app/routers/recipes.py` (append)
**Steps:** Filter `is_seed == true`; return list.
**Test:** `GET /recipes/featured` → `[]` (until seed) with 200.
**Done when:** Endpoint filters by seed flag.

---

# PHASE 5 — Scraper & Seed  (Kevin)

### Task 5.1 — Approved URL list
**Owner:** Kevin · **Blocked by:** 1.2
**Goal:** Whitelist file.
**Files:** `backend/seed/__init__.py` (empty), `backend/seed/approved_urls.py`
**Steps:** `APPROVED_URLS` — 8 real AllRecipes URLs (vodka pasta, Caesar salad, Margherita pizza, butter chicken, fried rice, carne asada tacos, falafel, Greek salad).
**Test:** `python -c "from seed.approved_urls import APPROVED_URLS; print(len(APPROVED_URLS))"` → `8`.
**Done when:** 8 URLs listed.

### Task 5.2 — Single-page scraper (JSON-LD first)
**Owner:** Kevin · **Blocked by:** 5.1
**Goal:** Parse ONE URL → dict. No DB.
**Files:** `backend/app/services/__init__.py` (empty), `backend/app/services/scraper.py`
**Steps:** `scrape_recipe(url) -> dict` with real `User-Agent`; prefer `<script type="application/ld+json">` Recipe, fall back to HTML; extract title, ingredients[], instructions[], prep/cook/total time, servings, rating, review_count, calories?, image_url, source_url=url; each field try/except → None.
**Test:** `python -c "from app.services.scraper import scrape_recipe; from seed.approved_urls import APPROVED_URLS; import json; print(json.dumps(scrape_recipe(APPROVED_URLS[0]), indent=2)[:500])"` → populated dict.
**Done when:** One URL parses with title + ingredients.

### Task 5.3 — Seed runner (rate-limited)
**Owner:** Kevin · **Blocked by:** 5.2, 2.5
**Goal:** Scrape all 8 → insert as seed.
**Files:** `backend/seed/run_seed.py`
**Steps:** Loop URLs → `scrape_recipe` → map to `Recipe` (`is_seed=true`, `author_id=None`, `source_url` set, default difficulty/budget/cuisine if unparseable); `time.sleep(2)` between; skip if `source_url` exists.
**Test:** `python -m seed.run_seed` → inserts up to 8; `GET /recipes/featured` returns them.
**Done when:** Featured returns real recipes. **← Ping team: seed data live, recipe UI unblocked.**

---

# PHASE 6 — Interactions  (Avaya)

### Task 6.1 — Like toggle
**Owner:** Avaya · **Blocked by:** 4.3, 3.4
**Goal:** `POST /recipes/{id}/like` toggles.
**Files:** `backend/app/routers/interactions.py`, append include to `main.py`
**Steps:** Auth; like exists → delete else insert; return `{liked, like_count}`.
**Test:** POST `/recipes/1/like` → true/1; again → false/0.
**Done when:** Toggle accurate.

### Task 6.2 — Save toggle
**Owner:** Avaya · **Blocked by:** 6.1
**Goal:** `POST /recipes/{id}/save`.
**Files:** `backend/app/routers/interactions.py` (append)
**Steps:** Same pattern; return `{saved, save_count}`.
**Test:** POST twice → toggles with correct count.
**Done when:** Save toggle works.

### Task 6.3 — Rate (upsert)
**Owner:** Avaya · **Blocked by:** 6.2
**Goal:** `POST /recipes/{id}/rate` sets/updates score.
**Files:** `backend/app/routers/interactions.py` (append)
**Steps:** Body `{score}` (validate 1–5); upsert on (user, recipe); return `{avg_rating, rating_count}`.
**Test:** Score 4 → 4.0/1; same user score 2 → 2.0/1 (updated, not added).
**Done when:** Upsert + average correct.

### Task 6.4 — Per-user state in GET recipe
**Owner:** Avaya · **Blocked by:** 6.3
**Goal:** Detail reflects caller's like/save/rating.
**Files:** `backend/app/routers/recipes.py` (modify 4.3), `schemas.py`
**Steps:** Make `GET /recipes/{id}` accept **optional** auth; if authed add `liked_by_me`, `saved_by_me`, `my_rating`.
**Test:** Authed after liking → `liked_by_me:true`; unauthed → false/null, still 200.
**Done when:** Reflects caller state, anon still works. **← Ping Avaya-frontend: interaction bar can wire.**

---

# PHASE 7 — Comments  (Adi)

### Task 7.1 — Comment schemas
**Owner:** Adi · **Blocked by:** 2.4
**Goal:** Create + nested output shapes.
**Files:** `backend/app/schemas.py` (append)
**Steps:** `CommentCreate` (body, parent_id?); `CommentOut` (id, body, author UserOut, parent_id, like_count, created_at, replies: list).
**Test:** `python -c "from app.schemas import CommentCreate, CommentOut; print('ok')"`.
**Done when:** Schemas import.

### Task 7.2 — Create comment
**Owner:** Adi · **Blocked by:** 7.1, 3.4
**Goal:** `POST /recipes/{id}/comments`.
**Files:** `backend/app/routers/comments.py`, append include to `main.py`
**Steps:** Auth; insert comment (optional `parent_id`); return `CommentOut`.
**Test:** POST top-level → 200; POST reply w/ `parent_id` → 200.
**Done when:** Comments + replies persist.

### Task 7.3 — List comments (sorted, nested)
**Owner:** Adi · **Blocked by:** 7.2
**Goal:** `GET /recipes/{id}/comments?sort=new|top`.
**Files:** `backend/app/routers/comments.py` (append)
**Steps:** Fetch top-level (parent_id null), attach replies one level; `new`→created desc, `top`→like_count desc.
**Test:** `?sort=new` → top-level with reply nested under `replies`.
**Done when:** Sorted nested list returns.

---

# PHASE 8 — Social, Search, Leaderboard

### Task 8.1 — Follow / unfollow
**Owner:** Adi · **Blocked by:** 2.4, 3.4
**Goal:** `POST`/`DELETE /users/{id}/follow`.
**Files:** `backend/app/routers/users.py`, append include to `main.py`
**Steps:** Auth; POST inserts follow (ignore self/dup), DELETE removes; return `{following}`.
**Test:** Make user B; POST `/users/{B}/follow` → true; DELETE → false.
**Done when:** Follow/unfollow works. **← Ping Archana: friends feed can build.**

### Task 8.2 — Public profile
**Owner:** Adi · **Blocked by:** 8.1
**Goal:** `GET /users/{username}` profile + stats + recipes.
**Files:** `backend/app/routers/users.py` (append)
**Steps:** Return user fields, `follower_count`, `following_count`, `recipe_count`, `avg_recipe_rating`, recipes list.
**Test:** `GET /users/<your-username>` → profile w/ counts + your recipes.
**Done when:** Aggregates return.

### Task 8.3 — Friends feed
**Owner:** Archana · **Blocked by:** 8.1, 4.4
**Goal:** `GET /recipes/friends` — followed users' recipes.
**Files:** `backend/app/routers/recipes.py` (append)
**Steps:** Auth; get followed ids; their recipes newest-first, paginated.
**Test:** Follow B (has recipe); `/recipes/friends` includes B's, excludes strangers'.
**Done when:** Filtered to follows.

### Task 8.4 — Search + filters
**Owner:** Archana · **Blocked by:** 4.4, 5.3
**Goal:** `GET /search` over recipes + users.
**Files:** `backend/app/routers/search.py`, append include to `main.py`
**Steps:** Params `q`, `cuisine`, `max_time`, `budget`, `difficulty`, `diet` (tag); `q` matches title OR username (case-insensitive); filters on recipes; return `{recipes, users}`.
**Test:** `?q=pasta` → vodka pasta seed; `?max_time=20` → quick recipes only.
**Done when:** Text + ≥1 filter work together.

### Task 8.5 — Leaderboard endpoint
**Owner:** Adi · **Blocked by:** 6.1, 5.3
**Goal:** `GET /leaderboard?type=...`.
**Files:** `backend/app/routers/leaderboard.py`, append include to `main.py`
**Steps:** Types: `top_rated`, `most_liked`, `most_saved`, `top_creators` (sum likes across user's recipes); return ranked list w/ metric.
**Test:** Like recipe 1 a few times; `?type=most_liked` → recipe 1 top.
**Done when:** ≥2 types return sensible order.

### Task 8.6 — For-You endpoint `[STRETCH]`
**Owner:** Archana · **Blocked by:** 6.1, 5.3
**Goal:** `GET /recipes/for-you` simple scoring.
**Files:** `backend/app/services/recommendations.py`, route in `recipes.py`
**Steps:** Score: +cuisine match to liked, +popularity (likes+saves), +recency; exclude already-liked; return top N.
**Test:** Like a pizza recipe → for-you ranks pizza/popular high.
**Done when:** Non-random, explainable order.

---

# PHASE 9 — Frontend Foundation  (Kaavya)

### Task 9.1 — Next.js scaffold
**Owner:** Kaavya · **Blocked by:** 0.1
**Goal:** Running App Router + TS + Tailwind.
**Files:** `frontend/` (Next scaffold)
**Steps:** Scaffold (App Router, TS, Tailwind, `src/`, alias `@/*`); strip `app/page.tsx` to a "Reci" heading.
**Test:** `npm run dev` → `localhost:3000` shows "Reci".
**Done when:** Dev server renders heading.

### Task 9.2 — Tailwind theme tokens (lavender)
**Owner:** Kaavya · **Blocked by:** 9.1
**Goal:** Tokens every component reuses.
**Files:** `frontend/tailwind.config.ts`, `frontend/src/app/globals.css`
**Steps:** Palette (primary lavender, accent white, secondary soft gray, optional pastel green); rounded default radius; soft shadow utility; load Poppins/Nunito/Quicksand in root layout.
**Test:** Temp `<div className="bg-primary text-white rounded-2xl shadow-soft p-4">test</div>` → lavender/rounded/shadowed. Remove after.
**Done when:** Theme applies visibly.

### Task 9.3 — shadcn/ui init + Button
**Owner:** Kaavya · **Blocked by:** 9.2
**Goal:** Component library wired.
**Files:** `frontend/components.json`, `frontend/src/components/ui/button.tsx`
**Steps:** Init shadcn/ui; add `Button`.
**Test:** `<Button>Click</Button>` renders styled. Remove after.
**Done when:** shadcn Button renders.

### Task 9.4 — Typed API wrapper + types
**Owner:** Kaavya · **Blocked by:** 9.1
**Goal:** Single choke point for backend calls.
**Files:** `frontend/src/lib/types.ts`, `frontend/src/lib/api.ts`, `frontend/.env.local`
**Steps:** `types.ts` mirrors backend `User`/`Recipe`/`Comment`/auth (identical field names to `RecipeOut`/`UserOut`); `api.ts` `apiFetch(path, options)` prefixes `NEXT_PUBLIC_API_URL`, attaches JWT cookie, throws non-2xx; `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000`.
**Test:** Temp server component `apiFetch('/health')` logs `{status:'ok'}`. Remove after.
**Done when:** Frontend hits backend via wrapper. **← Ping team: api.ts ready, all frontend lanes unblocked.**

---

# PHASE 10 — Frontend Auth  (Cindy)

### Task 10.1 — Auth helpers (cookie + session)
**Owner:** Cindy · **Blocked by:** 9.4
**Goal:** Store/read/clear JWT; fetch current user.
**Files:** `frontend/src/lib/auth.ts`, `frontend/src/hooks/useUser.ts`
**Steps:** `setToken`/`getToken`/`clearToken` (cookie); `useUser()` calls `/auth/me` → `{user, loading}`.
**Test:** With a valid token in cookies, a test component using `useUser()` shows username.
**Done when:** `useUser` resolves logged-in user.

### Task 10.2 — Signup & login pages
**Owner:** Cindy · **Blocked by:** 10.1, 3.4
**Goal:** Auth UI end-to-end.
**Files:** `frontend/src/app/(auth)/signup/page.tsx`, `frontend/src/app/(auth)/login/page.tsx`
**Steps:** Client forms → `/auth/signup` + `/auth/login` via `apiFetch`; on success store token, redirect `/`; error text on failure.
**Test:** `/signup` create → redirect home, `useUser` shows you; clear cookie, `/login` sign in → works; wrong password → error.
**Done when:** Real signup + login work. **← Ping team: auth flow live for gated UI.**

---

# PHASE 11 — Frontend Core UI

### Task 11.1 — RecipeCard component
**Owner:** Kaavya · **Blocked by:** 9.3, 9.4
**Goal:** The reusable card everyone depends on.
**Files:** `frontend/src/components/recipe/RecipeCard.tsx`
**Steps:** Props: a `Recipe`; show image, title, rating, cook time, difficulty, budget badge, save count; rounded, soft shadow, hover lift; links to `/recipe/[id]`.
**Test:** Render with a hardcoded recipe → looks right; click navigates to `/recipe/<id>`.
**Done when:** Card renders from `Recipe`, links out. **← Ping team: RecipeCard ready, all recipe lists unblocked.**

### Task 11.2 — Home feed page (real data)
**Owner:** Archana · **Blocked by:** 11.1, 4.4, 5.3
**Goal:** `/` lists backend recipes.
**Files:** `frontend/src/app/page.tsx`, `frontend/src/components/feed/FeedList.tsx`
**Steps:** Server component fetches `GET /recipes?skip=0&limit=10`; render grid of `RecipeCard`.
**Test:** With seed data, `/` shows scraped recipes as cards.
**Done when:** Real recipes render on homepage.

### Task 11.3 — Loading skeletons
**Owner:** Kaavya · **Blocked by:** 11.1
**Goal:** Skeleton placeholders for the feed.
**Files:** `frontend/src/components/shared/RecipeCardSkeleton.tsx`
**Steps:** Shimmer card matching `RecipeCard` dims; use as Suspense/loading fallback on feed.
**Test:** Throttle network, reload `/` → skeletons before cards.
**Done when:** Skeletons show during load.

### Task 11.4 — Recipe detail page
**Owner:** Avaya · **Blocked by:** 11.1, 4.3
**Goal:** `/recipe/[id]` full view.
**Files:** `frontend/src/app/recipe/[id]/page.tsx`, `frontend/src/components/recipe/RecipeHero.tsx`, `IngredientList.tsx`, `StepList.tsx`
**Steps:** Server component fetches `GET /recipes/{id}`; render hero, title, author, description, ingredients, steps, times, servings, cuisine, budget, avg rating; AllRecipes attribution link if `source_url`.
**Test:** Click a card → all fields show; seed recipe shows "from AllRecipes" link.
**Done when:** Full recipe renders w/ attribution.

### Task 11.5 — Interaction bar (like/save/rate)
**Owner:** Avaya · **Blocked by:** 11.4, 6.4, 10.2
**Goal:** Buttons that mutate state optimistically.
**Files:** `frontend/src/components/recipe/InteractionBar.tsx`
**Steps:** Client component; initial state from `liked_by_me`/`saved_by_me`/`my_rating`; like/save POST + optimistic update; star rating POSTs score; roll back on error.
**Test:** Logged in: like → fills instantly, +1; refresh → still liked; rate 5 → avg updates; logged out → prompts login/disabled.
**Done when:** Interactions persist across refresh.

---

# PHASE 12 — Frontend Social UI

### Task 12.1 — Navigation (bottom mobile / side desktop)
**Owner:** Kaavya · **Blocked by:** 9.3
**Goal:** Global nav to main routes.
**Files:** `frontend/src/components/nav/Nav.tsx`, used in root `layout.tsx`
**Steps:** Links: Home, For You, Friends, Search, Leaderboard, Profile; bottom bar mobile / sidebar desktop (responsive).
**Test:** Resize → layout switches; each link routes.
**Done when:** Nav works both breakpoints. **← Ping team: nav exists, link your pages in.**

### Task 12.2 — Profile page
**Owner:** Adi · **Blocked by:** 11.1, 8.2, 10.2
**Goal:** `/profile/[username]` stats + recipe tabs.
**Files:** `frontend/src/app/profile/[username]/page.tsx`, `ProfileHeader.tsx`, `RecipeTabs.tsx`
**Steps:** Fetch `GET /users/{username}`; show avatar, username, bio, follower/following/recipe counts, favorite cuisine; Recipes tab (others stretch); Follow button if not self (wired to 8.1).
**Test:** Your profile → stats + recipes; another user → Follow toggles.
**Done when:** Profile renders, follow works from UI.

### Task 12.3 — Search page with debounce
**Owner:** Archana · **Blocked by:** 11.1, 8.4
**Goal:** `/search` live results.
**Files:** `frontend/src/app/search/page.tsx`, `frontend/src/hooks/useDebounce.ts`, `FilterBar.tsx`
**Steps:** Debounced input → `GET /search?q=`; render recipe + user results; filter chips (budget, max_time, cuisine, diet) append params.
**Test:** Type "pasta" → results after typing stops; toggle "Under 15 min" → narrows.
**Done when:** Debounced search + ≥1 filter work.

### Task 12.4 — Leaderboard page
**Owner:** Adi · **Blocked by:** 11.1, 8.5
**Goal:** `/leaderboard` ranked views.
**Files:** `frontend/src/app/leaderboard/page.tsx`
**Steps:** Tabs/select for type (top_rated, most_liked, most_saved, top_creators); fetch `GET /leaderboard?type=`; ranked list.
**Test:** Open → ranked recipes; switch type → reorders.
**Done when:** ≥2 types display.

### Task 12.5 — Friends feed page
**Owner:** Archana · **Blocked by:** 11.1, 8.3
**Goal:** `/friends` shows followed users' recipes.
**Files:** `frontend/src/app/friends/page.tsx`
**Steps:** Fetch `GET /recipes/friends`; render cards; empty state if following no one.
**Test:** Follow a user w/ recipes → appear; before → empty state.
**Done when:** Follow-filtered recipes render.

### Task 12.6 — Recipe upload page
**Owner:** Avaya · **Blocked by:** 11.1, 4.2, 10.2
**Goal:** `/recipe/new` creates a recipe.
**Files:** `frontend/src/app/recipe/new/page.tsx`
**Steps:** Client form for `RecipeCreate` (ingredients/instructions as add-row lists; tags as chips); POST `/recipes`; redirect to new `/recipe/[id]`; image starts as `image_url` text field (Cloudinary = 13.1).
**Test:** Fill → submit → land on new recipe page with your data.
**Done when:** User creates a recipe via UI.

---

# PHASE 13 — Images, Infinite Scroll, Polish  `[STRETCH]`

### Task 13.1 — Cloudinary signed upload `[STRETCH]`
**Owner:** Avaya · **Blocked by:** 12.6
**Goal:** Real image uploads.
**Files:** `backend/app/routers/uploads.py`, upload widget in `/recipe/new`
**Steps:** Backend `POST /uploads/sign` returns signed params; frontend uploads directly to Cloudinary, puts URL in form.
**Test:** Pick image → uploads → preview → created recipe shows it.
**Done when:** User image appears on recipe.

### Task 13.2 — Infinite scroll on home feed `[STRETCH]`
**Owner:** Archana · **Blocked by:** 11.2
**Goal:** Auto-load more on scroll.
**Files:** `frontend/src/hooks/useFeed.ts`, modify `FeedList`
**Steps:** Client hook tracks `skip`, fetches next page on intersection-observer.
**Test:** 15+ recipes, scroll bottom → next page appends without click.
**Done when:** Feed paginates on scroll.

### Task 13.3 — Framer Motion transitions `[STRETCH]`
**Owner:** Kaavya · **Blocked by:** 11.1
**Goal:** Subtle entrance/hover animations.
**Files:** wrap `RecipeCard` + page transitions
**Steps:** Fade/slide on card mount; hover scale.
**Test:** Reload feed → cards animate in; hover → smooth scale.
**Done when:** Animations visible, not janky.

### Task 13.4 — Edit profile page `[STRETCH]`
**Owner:** Cindy · **Blocked by:** 12.2
**Goal:** Update bio/avatar/cuisine.
**Files:** `frontend/src/app/profile/edit/page.tsx`, backend `PATCH /users/me`
**Steps:** Form pre-filled from `useUser`; PATCH updates; reflect on profile.
**Test:** Change bio → save → profile shows it.
**Done when:** Edits persist.

### Task 13.5 — Comments UI on recipe page `[STRETCH]`
**Owner:** Adi · **Blocked by:** 11.4, 7.3
**Goal:** Show + post comments on a recipe.
**Files:** `frontend/src/components/recipe/CommentSection.tsx`, mount in `/recipe/[id]`
**Steps:** Fetch `GET /recipes/{id}/comments?sort=new`; render nested; client box posts a comment; new/top sort toggle.
**Test:** Post a comment → appears; reply nests; toggle reorders.
**Done when:** Comment read+write works in UI.

---

# PHASE 14 — Deploy  (Kevin lead, all assist)

### Task 14.1 — Deploy backend
**Owner:** Kevin · **Blocked by:** all backend phases green locally
**Goal:** FastAPI live on Render/Railway/Fly.
**Files:** `backend/` deploy config; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
**Steps:** Create service, set all `.env` vars (real), point at managed Postgres; run `create_tables.py` then `run_seed.py` on prod.
**Test:** `https://<backend>/health` → ok; `/recipes/featured` → seed.
**Done when:** Public API serves seeded data.

### Task 14.2 — Deploy frontend
**Owner:** Kaavya · **Blocked by:** 14.1, all frontend phases green locally
**Goal:** Next.js live on Vercel.
**Files:** Vercel project (root `frontend/`)
**Steps:** Set `NEXT_PUBLIC_API_URL` to deployed backend; set backend `FRONTEND_ORIGIN` to Vercel domain + redeploy backend (CORS); add Cloudinary/AllRecipes image domains to `next.config.js`.
**Test:** Vercel URL → feed loads from prod; signup works; recipe renders.
**Done when:** Deployed FE works end-to-end against deployed BE.

### Task 14.3 — Demo smoke test
**Owner:** Cindy · **Blocked by:** 14.2
**Goal:** Exact demo path works on prod.
**Files:** optional `DEMO.md` checklist
**Steps:** Walk signup → home feed → open recipe → like + rate → search "pasta" → profile → leaderboard.
**Test:** Every step works on deployed URLs, no console errors on demo path.
**Done when:** Full happy path green in production. **← Everyone: freeze features, rehearse.**

---

## Per-Person Task Summary

**Kaavya (design + shared):** 0.1 · 9.1 · 9.2 · 9.3 · 9.4 · 11.1 · 11.3 · 12.1 · 13.3* · 14.2
**Kevin (data backbone):** 1.1 · 1.2 · 1.3 · 1.4 · 2.1 · 2.2 · 2.3 · 2.4 · 2.5 · 5.1 · 5.2 · 5.3 · 14.1
**Cindy (auth):** 3.1 · 3.2 · 3.3 · 3.4 · 10.1 · 10.2 · 13.4* · 14.3
**Avaya (recipes + interactions):** 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 6.1 · 6.2 · 6.3 · 6.4 · 11.4 · 11.5 · 12.6 · 13.1*
**Archana (feeds + discovery):** 8.3 · 8.4 · 8.6* · 11.2 · 12.3 · 12.5 · 13.2*
**Adi (social + leaderboard):** 7.1 · 7.2 · 7.3 · 8.1 · 8.2 · 8.5 · 12.2 · 12.4 · 13.5*

`* = stretch`

---

## Sync Points (whole team pauses to integrate)

1. **After Kevin 2.5 + Kaavya 9.4** (~hour 2): schema + api wrapper live. Everyone pulls `main`, confirms their lane's blockers are in.
2. **After Kevin 5.3 + Kaavya 11.1** (~hour 4): seed data + RecipeCard. Recipe UI lanes start in earnest.
3. **After Cindy 10.2** (~hour 5): auth flow live. Gated features (upload, interactions, follow) wire up.
4. **Hour 8:** feature freeze. Only Phase 14 + demo-path bugfixes after this.

## What to Cut If Behind (in order)
1. All of Phase 13 (Cloudinary, infinite scroll, animations, edit profile, comments UI).
2. For-You (8.6) — friends feed + leaderboard already show personalization.
3. Comment nesting depth (flat comments OK) / backend 7.x if no UI time.
4. Extra leaderboard types (ship 2, not 4).
5. Notifications & messages — intentionally not in MVP.

## Integration Rules (keep 6 people from colliding)
- `models.py` = Kevin only. Need a change? Ping him.
- `main.py` router includes + `schemas.py` = append your own block; never rewrite another's. Conflicts → keep both.
- Branch `feature/<name>-<task>`, PR into `main`, merge every ~2 hours.
- Pull `main` at every sync point before starting new work.
