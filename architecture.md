# Reci — System Architecture

A social recipe platform (Beli for recipes). Next.js frontend, FastAPI + PostgreSQL backend, Cloudinary for images. Built for a 10-hour hackathon with a 6-person team.

---

## 0. Read This First (Hackathon Reality Check)

You have **10 hours and 6 people**. The spec describes a product that would take a team months. The job is not to build everything — it's to build a **vertical slice that demos well** and split work so 6 people never block each other.

**The single most important architectural decision:** lock the API contract and the database schema in the first 45 minutes. Everything else (frontend pages, backend endpoints, scraper) can be built in parallel *only if* everyone agrees on the shape of the data flowing between them. This document is that agreement.

**What "done" looks like at hour 10:** a logged-in user sees a feed of real scraped recipes, can open a recipe, rate/save/like it, view a profile with a leaderboard, and search. Chat, nested comments, reposts, notifications, and the "continuously improving" rec algorithm are **stretch** — scoped at the bottom so they can be cut without breaking anything.

---

## 1. High-Level Shape

```
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│   Next.js (App Router) on Vercel                             │
│   React + TS + Tailwind + shadcn/ui + Framer Motion         │
│                                                              │
│   - Server Components fetch read-only data                   │
│   - Client Components handle interaction (like/save/forms)   │
│   - Auth token stored in httpOnly cookie                     │
└───────────────┬──────────────────────────────────────────────┘
                │  HTTPS / REST (JSON)
                │  Authorization: Bearer <JWT>
                ▼
┌──────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                         │
│   (Render / Railway / Fly.io)                               │
│                                                              │
│   Routers → Services → CRUD → SQLAlchemy Models             │
│   JWT auth · Pydantic validation · CORS                     │
│                                                              │
│   Background: AllRecipes scraper (seed job, run once)        │
└──────┬──────────────────────────────┬────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐            ┌──────────────────┐
│  PostgreSQL  │            │   Cloudinary     │
│  (Neon/      │            │  user image      │
│   Supabase/  │            │  uploads         │
│   Railway)   │            │  (URLs stored    │
│              │            │   in Postgres)   │
└──────────────┘            └──────────────────┘
```

**Three deployables, three owners:**
1. `frontend/` → Vercel
2. `backend/` → Render (or Railway/Fly)
3. PostgreSQL → managed (Neon free tier is fastest to stand up; Supabase or Railway also fine)

Cloudinary is a SaaS — no deploy, just API keys.

---

## 2. Repository Layout

The given repo is `https://github.com/Kcruz28/hackatonn.git`. Use a **monorepo** — one repo, two top-level folders. Simplest for a hackathon; no package-linking headaches.

```
hackatonn/
├── README.md
├── architecture.md          ← this file
├── .gitignore
├── docker-compose.yml        ← optional: local Postgres in one command
│
├── frontend/                 ← Next.js app (Vercel root = this dir)
│   └── (see §4)
│
└── backend/                  ← FastAPI app (Render root = this dir)
    └── (see §3)
```

> **Git hygiene for 6 people:** protect `main`. Everyone works on `feature/<name>-<thing>` branches and opens PRs. Agree that `backend/app/models.py` and the API contract (§6) are "touch-with-care" files — ping the channel before editing. Merge conflicts in those two places are what will actually hurt you.

---

## 3. Backend (`backend/`)

### 3.1 Folder structure

```
backend/
├── requirements.txt
├── .env                      ← NOT committed
├── .env.example              ← committed, documents required vars
├── alembic.ini               ← optional (migrations). Skip if tight on time.
│
├── seed/
│   ├── approved_urls.py      ← the 8 whitelisted AllRecipes URLs
│   └── run_seed.py           ← scrape + insert seed recipes
│
└── app/
    ├── main.py               ← FastAPI app, CORS, router registration
    ├── config.py             ← reads env vars (Settings via pydantic)
    ├── database.py           ← engine, SessionLocal, Base, get_db()
    ├── models.py             ← ALL SQLAlchemy models (§5)
    ├── schemas.py            ← ALL Pydantic request/response models
    ├── security.py           ← password hashing, JWT encode/decode
    ├── deps.py               ← get_current_user, pagination params
    │
    ├── routers/
    │   ├── auth.py           ← signup, login, me
    │   ├── users.py          ← profile, edit, follow/unfollow, friends
    │   ├── recipes.py        ← CRUD, feed, for-you, friends-feed
    │   ├── interactions.py   ← like, save, rate, repost
    │   ├── comments.py       ← create, list, like comment
    │   ├── search.py         ← global search + filters
    │   ├── leaderboard.py    ← top recipes / creators / trending
    │   ├── notifications.py  ← list, mark read   (stretch)
    │   ├── messages.py       ← chat                (stretch)
    │   └── uploads.py        ← Cloudinary signature / proxy upload
    │
    ├── services/
    │   ├── recommendations.py← For-You scoring logic
    │   ├── leaderboard.py    ← ranking queries / aggregation
    │   └── scraper.py        ← AllRecipes parser (BeautifulSoup)
    │
    └── crud/                 ← thin DB helpers, keep routers clean
        ├── recipes.py
        ├── users.py
        └── interactions.py
```

> **Why this split.** Routers = HTTP layer (parse request, call service/crud, return schema). Services = business logic (recommendations, ranking, scraping). CRUD = database reads/writes. Keeping these separate is what lets Kevin work on the scraper while Adi works on auth without touching the same file. If you're *really* crunched, you can collapse `crud/` into the routers — but keep `services/` separate because that's the interesting logic.

### 3.2 What each core file does

| File | Responsibility |
|------|----------------|
| `main.py` | Creates the `FastAPI()` instance, adds CORS middleware (allow your Vercel domain + `localhost:3000`), includes every router. On startup, optionally creates tables (`Base.metadata.create_all`). |
| `config.py` | One `Settings` class loading `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `FRONTEND_ORIGIN`. Import this everywhere instead of reading `os.environ` ad hoc. |
| `database.py` | SQLAlchemy `engine`, `SessionLocal`, declarative `Base`, and the `get_db()` dependency that yields a session per request and closes it. |
| `models.py` | Every table as a class. **The schema is the contract for the DB.** Lock it early (§5). |
| `schemas.py` | Pydantic models for input validation and output shaping. `RecipeOut`, `RecipeCreate`, `UserOut`, `Token`, etc. These define the **JSON shape the frontend codes against**. |
| `security.py` | `hash_password`, `verify_password` (passlib/bcrypt), `create_access_token`, `decode_token`. |
| `deps.py` | `get_current_user(token)` → resolves JWT to a `User` row or 401. Reusable pagination (`skip`, `limit`) dependency. |

### 3.3 Request lifecycle (example: liking a recipe)

```
POST /recipes/42/like
  → CORS middleware
  → router interactions.like_recipe()
  → deps.get_current_user()   resolves JWT → User
  → crud.interactions.toggle_like(db, user_id, recipe_id)
        - insert/delete row in `likes`
        - recompute recipe.like_count (or COUNT on read)
  → return { "liked": true, "like_count": 123 }   (schema: LikeResponse)
```

Everything follows this pattern. Once one router is built end-to-end, the rest are copy-shape-and-modify — which is how you parallelize.

---

## 4. Frontend (`frontend/`)

### 4.1 Folder structure

```
frontend/
├── package.json
├── next.config.js            ← allow Cloudinary + AllRecipes image domains
├── tailwind.config.ts        ← theme: lavender palette, font
├── .env.local                ← NEXT_PUBLIC_API_URL
│
├── public/                   ← static assets, logo, placeholder food img
│
└── src/
    ├── app/                  ← App Router (file = route)
    │   ├── layout.tsx        ← root layout: fonts, <Nav>, providers
    │   ├── globals.css
    │   ├── page.tsx          ← Home feed (/)
    │   │
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   │
    │   ├── for-you/page.tsx
    │   ├── friends/page.tsx
    │   ├── search/page.tsx
    │   ├── leaderboard/page.tsx
    │   ├── notifications/page.tsx   (stretch)
    │   ├── messages/page.tsx        (stretch)
    │   │
    │   ├── recipe/
    │   │   ├── [id]/page.tsx        ← recipe detail
    │   │   └── new/page.tsx         ← upload form
    │   │
    │   └── profile/
    │       └── [username]/page.tsx
    │
    ├── components/
    │   ├── ui/               ← shadcn/ui generated components
    │   ├── nav/              ← BottomNav (mobile) + SideNav (desktop)
    │   ├── recipe/           ← RecipeCard, RecipeHero, RatingStars,
    │   │                       IngredientList, StepList, BudgetBadge
    │   ├── feed/             ← FeedList, FeedPost, InteractionBar
    │   ├── profile/          ← ProfileHeader, StatRow, RecipeTabs
    │   └── shared/           ← Avatar, Skeletons, EmptyState, FilterBar
    │
    ├── lib/
    │   ├── api.ts            ← typed fetch wrapper (attaches JWT)
    │   ├── auth.ts           ← login/logout/session helpers
    │   └── types.ts          ← TS interfaces MIRRORING backend schemas
    │
    └── hooks/
        ├── useUser.ts        ← current user / auth state
        ├── useFeed.ts        ← infinite scroll feed
        └── useDebounce.ts    ← search input debounce
```

### 4.2 Server vs Client Components (the key Next.js decision)

| Use a **Server Component** (default) for | Use a **Client Component** (`"use client"`) for |
|---|---|
| Recipe detail page (fetch by id, render) | Like / Save / Rate buttons (state + POST) |
| Leaderboard (fetch list, render) | Upload form (controlled inputs, file picker) |
| Profile page shell | Search box (debounced typing) |
| Initial feed page load | Infinite-scroll feed list, chat |

Rule of thumb: **if it has `onClick`/`onChange` or local state, it's a Client Component.** Fetch read-only data on the server where you can; make the interactive leaves client components. Don't make the whole page a client component just because one button needs interactivity — push the `"use client"` down to the smallest component.

### 4.3 The API wrapper (`lib/api.ts`)

One choke point for every backend call. It:
- reads `NEXT_PUBLIC_API_URL`,
- attaches `Authorization: Bearer <token>`,
- throws on non-2xx so components can show error states.

This is what makes the frontend resilient to backend not-being-ready: stub the return types now (`lib/types.ts`), wire real calls when endpoints land. **Frontend never hardcodes `fetch('http://localhost:8000/...')` anywhere except inside this file.**

---

## 5. Database Schema (the real contract)

Lock this in the first hour. Everything downstream depends on it. Models live in `backend/app/models.py`.

### 5.1 Core tables

```
users
  id (PK) · username (unique) · email (unique) · hashed_password
  bio · avatar_url · favorite_cuisine · created_at

recipes
  id (PK) · author_id (FK→users, NULLABLE for scraped seed)
  title · description · ingredients (JSON) · instructions (JSON)
  prep_time · cook_time · total_time · servings · calories
  difficulty (enum: beginner/intermediate/advanced)
  budget (enum: $/$$/$$$) · cuisine · tags (JSON/array)
  image_url · source_url (AllRecipes attribution, NULL for user recipes)
  is_seed (bool) · created_at
  -- denormalized counters (optional but fast): avg_rating, rating_count,
     like_count, save_count

ratings
  id (PK) · user_id (FK) · recipe_id (FK) · score (1-5) · created_at
  UNIQUE(user_id, recipe_id)        ← one rating per user per recipe

likes
  id (PK) · user_id (FK) · recipe_id (FK) · created_at
  UNIQUE(user_id, recipe_id)

saves
  id (PK) · user_id (FK) · recipe_id (FK) · created_at
  UNIQUE(user_id, recipe_id)

reposts                                ← stretch
  id (PK) · user_id (FK) · recipe_id (FK) · created_at

comments
  id (PK) · user_id (FK) · recipe_id (FK)
  parent_id (FK→comments, NULL = top level)   ← nesting
  body · like_count · created_at

follows                                ← directional (Instagram-style)
  id (PK) · follower_id (FK) · followed_id (FK) · created_at
  UNIQUE(follower_id, followed_id)

friendships                            ← mutual (Beli-style), stretch
  id (PK) · user_a_id · user_b_id
  status (pending/accepted) · created_at

notifications                          ← stretch
  id (PK) · user_id (recipient, FK) · actor_id (FK)
  type (like/comment/follow/save/...) · recipe_id (nullable)
  is_read (bool) · created_at

messages                               ← stretch
  id (PK) · sender_id (FK) · receiver_id (FK)
  body · recipe_id (nullable, for sharing a recipe) · created_at
```

### 5.2 Modeling decisions worth calling out

- **`ingredients` / `instructions` as JSON columns**, not separate tables. A normalized `ingredients` table is "correct" but costs you hours of joins for zero hackathon benefit. JSON arrays render directly in the frontend.
- **Scraped recipes have `author_id = NULL`, `is_seed = true`, `source_url` set.** This cleanly separates seed content from user content and gives you the required AllRecipes attribution for free.
- **`follows` (directional) vs `friendships` (mutual).** The feed and For-You only need `follows`. Build `follows` first; treat mutual friend requests as stretch. Don't build both on hour one.
- **Denormalized counters (`like_count`, `avg_rating`, …).** Two valid approaches: (a) compute with `COUNT`/`AVG` on read — simplest, correct, fine at hackathon scale; (b) store a counter column and update on write — faster reads, more code. **Start with (a).** Only add counters if the leaderboard feels slow.
- **Unique constraints on (user, recipe)** for likes/saves/ratings prevent double-counting and make "toggle" logic trivial.

### 5.3 Relationship diagram

```
users ──< recipes            (author, nullable for seed)
users ──< ratings >── recipes
users ──< likes   >── recipes
users ──< saves   >── recipes
users ──< comments>── recipes   (comments self-ref via parent_id)
users ──< follows >── users     (follower / followed)
users ──< messages>── users     (sender / receiver)
recipes ──< reposts >── users
```

---

## 6. API Contract (freeze this with the schema)

REST, JSON, JWT in `Authorization` header. This is the table the frontend and backend both code against. Method + path + what it returns — agree on it, then build both sides in parallel.

### Auth
```
POST /auth/signup        {username,email,password} → {token, user}
POST /auth/login         {email,password}          → {token, user}
GET  /auth/me            (JWT)                      → user
```

### Users / social
```
GET  /users/{username}            → profile + stats + recipes
PATCH/users/me                    → update bio/avatar/cuisine
POST /users/{id}/follow           → {following:true}
DELETE /users/{id}/follow         → {following:false}
GET  /users/{id}/followers        → [user]
GET  /users/{id}/following        → [user]
```

### Recipes / feeds
```
GET  /recipes                     ?skip&limit       → [recipe]   (home feed)
GET  /recipes/for-you             (JWT)             → [recipe]   (rec algo)
GET  /recipes/friends             (JWT)             → [recipe]   (followed)
GET  /recipes/{id}                → full recipe (+ comments, your-state)
POST /recipes                     (JWT) RecipeCreate→ recipe
GET  /recipes/featured            → [recipe]   (is_seed=true, homepage cards)
```

### Interactions
```
POST   /recipes/{id}/like         → {liked, like_count}
POST   /recipes/{id}/save         → {saved, save_count}
POST   /recipes/{id}/rate         {score} → {avg_rating, rating_count}
POST   /recipes/{id}/repost       → {reposted}            (stretch)
GET    /recipes/{id}/comments     ?sort=new|top → [comment]
POST   /recipes/{id}/comments     {body,parent_id?} → comment
```

### Discovery
```
GET  /search        ?q&budget&max_time&diet&cuisine&meal&difficulty
                    → {recipes:[...], users:[...]}
GET  /leaderboard   ?type=top_rated|top_creators|most_liked|
                          most_saved|trending_week
                    → [ranked item]
```

### Media / stretch
```
POST /uploads/sign                → Cloudinary signed params (client uploads direct)
GET  /notifications  (JWT)        → [notification]      (stretch)
POST /notifications/read          → {ok}                (stretch)
GET  /messages/{userId} (JWT)     → [message]           (stretch)
POST /messages/{userId} (JWT)     → message             (stretch)
```

> On `/recipes/{id}` returning "your-state": include `liked_by_me`, `saved_by_me`, `my_rating` when a JWT is present, so the detail page renders buttons in the right state without extra round-trips.

---

## 7. Where State Lives

State is scattered across five places. Knowing which is which prevents the classic bug where the UI and DB disagree.

| State | Lives in | Notes |
|---|---|---|
| **Source of truth** (recipes, users, likes, ratings…) | **PostgreSQL** | The only durable store. Everything else is a cache or a copy. |
| **Auth identity** | **JWT**, in an httpOnly cookie | Stateless on the server — the token *is* the session. Backend verifies signature; no session table needed. |
| **Server-rendered data** | Next.js Server Components (per request) | Fetched fresh on navigation; not persisted client-side. |
| **Interaction UI state** (is this liked, form inputs, modal open) | React state in Client Components | Optimistically updated on click, reconciled with the POST response. |
| **Uploaded image bytes** | **Cloudinary** | DB stores only the returned URL. Never store image binaries in Postgres. |

**The optimistic-update pattern** (used for like/save/rate): on click, immediately flip the UI, fire the POST, and if it fails, roll back. Makes the app feel instant. The DB remains the arbiter of truth on next load.

**Auth flow:** login → backend returns JWT → store in cookie → `lib/api.ts` attaches it to every request → backend `get_current_user` decodes it per call. Logout = delete the cookie. No server-side session state to manage.

---

## 8. How Services Connect (data flow walkthroughs)

**Loading the home feed**
```
page.tsx (server) → api.ts GET /recipes?skip=0&limit=10
  → FastAPI recipes router → crud.recipes.list_feed(db)
  → Postgres returns rows → RecipeOut schema → JSON
  → FeedList renders RecipeCards
  → useFeed hook requests next page on scroll (skip=10, …)
```

**Uploading a recipe with a photo**
```
recipe/new (client form)
  1. GET /uploads/sign  → backend returns Cloudinary signature
  2. Browser uploads file DIRECTLY to Cloudinary → gets image_url
  3. POST /recipes {..., image_url}  → backend saves row
  4. redirect to /recipe/{id}
```
*(Direct-to-Cloudinary keeps large files off your backend. If signing is fiddly, fallback: POST the file to the backend and let it upload — simpler, slightly slower. Pick based on time left.)*

**For-You page**
```
GET /recipes/for-you (JWT)
  → services/recommendations.py
  → score candidate recipes by: cuisine match to user's likes,
    popularity (likes+saves), recency, followed-author boost
  → return top N
```

**Seeding from AllRecipes (run once, near the start)**
```
python -m seed.run_seed
  → seed/approved_urls.py  (8 whitelisted URLs)
  → services/scraper.py    requests + BeautifulSoup, rate-limited (sleep)
  → parse title, ingredients, steps, times, servings, rating, nutrition,
    source_url, image_url
  → insert recipes with is_seed=true, author_id=NULL
  → app now has real content to demo against
```

---

## 9. The Scraper (compliance + scope)

A hard requirement with explicit guardrails. Build it as a **one-shot seed script, not a live endpoint.**

- **Whitelist only.** The 8 URLs in `approved_urls.py` (vodka pasta, Caesar salad, Margherita pizza, butter chicken, fried rice, carne asada tacos, falafel, Greek salad). No crawling, no following links, no mass scraping.
- **Be polite.** `time.sleep()` between requests, a real `User-Agent`, respect `robots.txt`. You're fetching 8 pages once — keep it that way.
- **Store the link, not the asset.** Save `image_url` and `source_url` as references for attribution; do **not** copy/redistribute images. Display "Recipe from AllRecipes" with a link back on every seed recipe.
- **Parse defensively.** AllRecipes markup varies; wrap each field in try/except and tolerate missing nutrition. Prefer their embedded JSON-LD (`<script type="application/ld+json">`) if present — it's far more stable than scraping divs.
- **Output:** rows in `recipes`. That's it. The frontend treats seed and user recipes identically except for the attribution link.

---

## 10. Six-Person Work Split

Parallelize along the contract seams so people don't collide. Everyone is unblocked the moment §5 (schema) and §6 (API) are agreed.

| Person | Owns | Deliverable |
|---|---|---|
| **You (lead)** | `models.py` + `schemas.py` + API contract + glue | Lock schema/contract hour 1, then unblock others, own deploy + integration |
| **Cindy** | Auth end-to-end | signup/login/me backend + login/signup pages + cookie/JWT wiring |
| **Avaya** | Recipe detail + upload | `/recipe/[id]`, `/recipe/new`, recipe + interactions routers |
| **Archana** | Feed + For-You | home feed, friends feed, `useFeed`, recommendations service |
| **Kevin** | Scraper + seed data + leaderboard | `scraper.py`, `run_seed.py`, leaderboard router + page |
| **Adi** | Profiles + social + search | profile page, follow/unfollow, search router + page + filters |
| **Kaavya** | Design system + shared UI | Tailwind theme, shadcn setup, `RecipeCard`, nav, skeletons, the lavender/glassmorphism look everyone reuses |

> **Critical sequencing:** Kaavya's `RecipeCard` and Kevin's seed data are dependencies for *everyone* showing recipes — do those first. The lavender design tokens and the card component should exist by hour 2 so no one builds throwaway UI.

**Integration checkpoints:** merge to `main` every ~2 hours, not at the end. The team that integrates continuously demos; the team that integrates at hour 9 does not.

---

## 11. Build Order (hour-by-hour skeleton)

1. **H0–1** — Repo skeleton, schema + contract frozen, Postgres + Cloudinary provisioned, `.env.example` filled, design tokens + `RecipeCard` started.
2. **H1–3** — Auth working end-to-end. Scraper seeds DB. Backend `GET /recipes` returns real rows. Frontend renders the feed from real data.
3. **H3–6** — Recipe detail, upload, like/save/rate, profile, search. This is the meat.
4. **H6–8** — For-You, leaderboard, friends feed. Polish the design pass (animations, skeletons, hover).
5. **H8–9** — Deploy both halves, fix CORS/env/prod bugs, seed prod DB.
6. **H9–10** — Freeze features. Rehearse the demo on the deployed URL. Fix only demo-path bugs.

**Cut line (drop these without guilt if behind):** chat, notifications, reposts, nested-comment replies, mutual friend requests, "continuously improving" rec loop. The demo survives without all of them.

---

## 12. Environment Variables

```
# backend/.env
DATABASE_URL=postgresql://user:pass@host:5432/reci
JWT_SECRET=<long-random-string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_ORIGIN=https://reci.vercel.app

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://reci-api.onrender.com
```

Commit `.env.example` with these keys (no values). The number-one deploy-day bug is a missing or mismatched env var — especially `FRONTEND_ORIGIN` (CORS) and `NEXT_PUBLIC_API_URL` pointing at localhost in prod.

---

## 13. Cheat Sheet

- **Source of truth:** PostgreSQL. Everything else is a copy.
- **Auth:** stateless JWT in a cookie; `get_current_user` decodes per request.
- **Frontend↔backend:** every call goes through `lib/api.ts`; shapes defined in `schemas.py` ↔ mirrored in `lib/types.ts`.
- **Server Components** fetch; **Client Components** interact. Push `"use client"` to the leaves.
- **Images:** bytes in Cloudinary, URLs in Postgres.
- **Scraper:** one-shot, whitelist-only, attribute back, store links not assets.
- **Parallelism comes from the contract.** Freeze §5 and §6 first; everything else follows.
- **Integrate every 2 hours. Cut the stretch list without mercy.**
