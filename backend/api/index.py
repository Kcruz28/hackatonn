"""Vercel serverless entrypoint.

Vercel's Python runtime serves the ASGI `app` exposed here. All routes are
defined on the FastAPI app in app/main.py; vercel.json rewrites every path to
this function so /auth/*, /recipes, etc. are handled normally.
"""
from app.main import app  # noqa: F401  (re-exported for Vercel)
