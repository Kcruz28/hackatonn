# Reci

Reci is a social recipe platform (think *Beli for recipes*): browse a feed of real recipes scraped from the web, open a recipe to see its ingredients and steps, add your own recipes, set a profile photo, and see a ranked leaderboard. It's a monorepo with a **FastAPI + Supabase** backend and a **Next.js (App Router)** frontend.

- `backend/` — FastAPI API backed by Supabase (Postgres + Auth)
- `frontend/` — Next.js App Router web app (TypeScript + Tailwind CSS v4)
- `architecture.md` — system design · `tasks.md` — build plan

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, lucide-react |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2, psycopg2 |
| Database | Supabase Postgres (accessed via the transaction pooler) |
| Auth | Supabase Auth (GoTrue) — username/email + password, JWT access tokens |
| Hosting | Vercel (frontend project + backend serverless project) |

---

## Features implemented

- **Auth** — sign up (username + email + password) and log in by **username _or_ email**. JWT stored in a cookie and attached to API calls. Friendly errors (e.g. auto-switch to "Sign in" if the account already exists).
- **Feed** — pulls real recipes from `GET /recipes` (no hardcoded data). Star rating comes from Supabase (`avg_stars` from reviews, falling back to the seeded `rating`); tier and cuisine are derived; tags/saves remain as UI.
- **Recipe detail** — click any card to open a modal with the recipe's **ingredients** and **steps** (HTML entities decoded).
- **Add recipe** — a modal posts to `POST /recipes` (author taken from the token) and the new recipe appears at the top of the feed.
- **My Rankings** — recipes pulled from the API and sorted by rating, with tier filters.
- **Profile** — header + sidebar show the logged-in user's name/username from `/auth/me`; click your sidebar photo to set an avatar URL (saved via `PATCH /profiles/me`, displayed from Supabase `avatar_url`).
- **Landing page** — pre-login food cards pull placeholder images from Supabase (`GET /recipes`), falling back to color blocks if the API is unavailable.
- **Seed data** — 8 recipes seeded from scraped AllRecipes data; the live DB also contains ~100 additional scraped recipes (some authorless, handled gracefully).

---

## Project structure

```
backend/
  app/
    main.py            # FastAPI app + CORS
    config.py          # settings (env vars)
    database.py        # SQLAlchemy engine/session (NullPool for serverless)
    models.py          # Profile, Recipe, Review, Follow, Friendship
    deps.py            # auth dependency (get_current_user)
    supabase_client.py # GoTrue admin/password HTTP calls
    common.py          # ProfileSummary, resolve_profile
    routers/           # auth, profiles, recipes, reviews, friends, followers, following
  seed/
    run_seed.py        # seed recipes from recipes.json
  api/index.py         # Vercel serverless entrypoint (re-exports app)
  vercel.json          # routes all paths to the serverless function
  requirements.txt
  .env.example         # template for secrets (copy to .env)

frontend/
  src/
    app/
      page.tsx                       # single-page app controller (feed, nav, modals)
      components/                    # auth-page, landing-page, recipe-card,
                                     # recipe-detail-modal, add-recipe-modal,
                                     # rankings-view, lists-view, friends-view, app-data
    lib/
      api.ts            # apiFetch wrapper (resolves API URL, attaches JWT)
      auth.ts           # token cookie helpers
      types.ts          # backend response types
      recipe-map.ts     # backend recipe -> card shape (+ rating/cuisine/tier)
    hooks/useUser.ts    # current profile from /auth/me
  .env.local            # NEXT_PUBLIC_API_URL (optional override)
```

---

## Recipe data model (live Supabase `recipes` table)

`recipe_id`, `author_id` (nullable — scraped recipes may have none), `title`, `ingredients` (text), `steps` (text), `image_url`, `created_at`, `rating` (bigint), `budget` (text, `$`/`$$`/`$$$`), `saves` (bigint). Ratings for display come primarily from the `reviews` table aggregate (`avg_stars`).

---

## Local development

### Prerequisites
- Python 3.11+ and Node.js 18+
- A Supabase project (Postgres + Auth) with the tables created

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (copy from `.env.example`) and fill in:

```env
# Use the Supabase TRANSACTION POOLER URI (port 6543), not the direct db.<ref> host.
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
FRONTEND_ORIGIN=http://localhost:3000
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<publishable key>     # Settings -> API
SUPABASE_SERVICE_KEY=<secret key>       # Settings -> API (backend only!)
```

Run the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Health: http://localhost:8000/health
- Docs: http://localhost:8000/docs

Seed recipes (optional, idempotent):

```bash
python -m seed.run_seed
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. By default the frontend targets the **same host it's
opened from** on port 8000 (so it also works from other devices on your network).
To override, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

### Running for other devices on your network
- Start the backend with `--host 0.0.0.0` (as above) so it's reachable on your LAN.
- Visit `http://<your-LAN-ip>:3000` from the other device.
- On Windows you may need to allow ports 3000 and 8000 through the firewall:
  ```powershell
  New-NetFirewallRule -DisplayName "Reci dev 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
  New-NetFirewallRule -DisplayName "Reci dev 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
  ```

---

## API overview

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | username + email + password → token + profile |
| POST | `/auth/login` | username **or** email + password → token |
| GET | `/auth/me` | current profile (auth) |
| GET | `/recipes` | list, newest-first (public) |
| GET | `/recipes/{id}` | single recipe + reviews (public) |
| POST | `/recipes` | create (auth; author from token) |
| DELETE | `/recipes/{id}` | author-only |
| GET/PATCH | `/profiles/me` | own profile / update name, avatar_url, bio |
| — | `/reviews`, `/friends`, `/followers`, `/following` | social endpoints |

CORS is open (`allow_origin_regex=".*"`, no credentials) because auth uses bearer tokens, so the app works from any origin/device.

---

## Deployment (Vercel — free, serverless, no separate server)

The frontend and backend deploy as **two Vercel projects** from the same repo.

### Backend (serverless)
The `backend/` folder deploys as Python serverless functions automatically —
`api/index.py` re-exports the FastAPI `app`, and `vercel.json` routes every path
to it. The engine uses `NullPool` so ephemeral function instances don't hold idle
DB connections (real pooling is handled by Supabase's transaction pooler).

1. Vercel → **Add New → Project** → import the repo.
2. Set **Root Directory = `backend`**, Framework Preset = **Other**.
3. Add env vars: `DATABASE_URL` (pooler URI), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`.
4. Deploy → verify `https://<backend>.vercel.app/health`.

### Frontend
1. The frontend project's **Root Directory = `frontend`**.
2. Set env var `NEXT_PUBLIC_API_URL = https://<backend>.vercel.app` (no trailing slash).
3. **Redeploy** (NEXT_PUBLIC_* values are baked in at build time).

> An HTTPS frontend must call an HTTPS backend (no mixed content) — the Vercel
> backend URL satisfies this.

---

## Troubleshooting notes

- **`could not translate host name "db.<ref>.supabase.co"`** — you used the direct
  connection string. Switch `DATABASE_URL` to the **transaction pooler** URI
  (`aws-0-<region>.pooler.supabase.com:6543`), which works over IPv4.
- **`Unregistered API key` / auth failing** — your Supabase API keys were rotated.
  Copy the current publishable/secret keys from Supabase → Settings → API into
  `backend/.env` (or Vercel env vars) and restart/redeploy.
- **Signup works locally but not from another device / Vercel** — the frontend was
  pointing at `localhost`. It now targets the host it's opened from, or set
  `NEXT_PUBLIC_API_URL` to the deployed backend URL.
- **`.env` changes don't take effect** — env files are read at startup; restart the
  backend (and redeploy the frontend) after editing them.
