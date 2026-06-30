"""Thin HTTP client for Supabase Auth (GoTrue) admin + password endpoints."""
from __future__ import annotations

import httpx
from fastapi import HTTPException

from app.config import settings

_TIMEOUT = 20.0


def _admin_headers() -> dict[str, str]:
    key = settings.SUPABASE_SERVICE_KEY
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def _error_message(resp: httpx.Response) -> str:
    try:
        body = resp.json()
        return body.get("msg") or body.get("error_description") or body.get("message") or str(body)
    except Exception:
        return resp.text


def admin_create_user(email: str, password: str, username: str) -> dict:
    """Create an email-confirmed user via the admin API. Returns the user object."""
    resp = httpx.post(
        f"{settings.auth_url}/admin/users",
        headers=_admin_headers(),
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"username": username},
        },
        timeout=_TIMEOUT,
    )
    if resp.status_code in (200, 201):
        return resp.json()
    msg = _error_message(resp)
    if resp.status_code in (409, 422) or "already" in msg.lower() or "registered" in msg.lower():
        raise HTTPException(status_code=409, detail="Email already registered")
    raise HTTPException(status_code=502, detail=f"Auth provider error: {msg}")


def admin_get_user(user_id: str) -> dict:
    """Fetch a user (incl. email) by id via the admin API."""
    resp = httpx.get(
        f"{settings.auth_url}/admin/users/{user_id}", headers=_admin_headers(), timeout=_TIMEOUT
    )
    if resp.status_code == 200:
        return resp.json()
    raise HTTPException(status_code=404, detail="Auth user not found")


def password_login(email: str, password: str) -> dict:
    """Exchange email + password for a session (access_token, refresh_token, ...)."""
    resp = httpx.post(
        f"{settings.auth_url}/token",
        params={"grant_type": "password"},
        headers={"apikey": settings.SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=_TIMEOUT,
    )
    if resp.status_code == 200:
        return resp.json()
    raise HTTPException(status_code=401, detail="Invalid username or password")
