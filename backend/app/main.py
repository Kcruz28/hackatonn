"""FastAPI app wiring the profile/social endpoint skeletons.

SKELETON: every router returns mock data and persists nothing — it defines the API
contract the frontend codes against. When the database team's models/session land,
each router's `mock_*` helpers get swapped for real queries; the routes and response
shapes here stay put.

Run:  uvicorn app.main:app --reload   (from the backend/ directory)
Docs: http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import followers, following, friends, recipes, reviews

app = FastAPI(title="Reci API — profile/social endpoints")

# CORS — allow the configured frontend origin (plus localhost for dev).
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({settings.FRONTEND_ORIGIN, "http://localhost:3000"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(recipes.router)
app.include_router(reviews.router)
app.include_router(friends.router)
app.include_router(followers.router)
app.include_router(following.router)
