"""Supabase JWT verification (ES256 via JWKS)."""
from __future__ import annotations

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.config import settings

_jwk_client: PyJWKClient | None = None


def _jwks() -> PyJWKClient:
    """Lazily-built, key-caching JWKS client for the project's signing keys."""
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(settings.jwks_url)
    return _jwk_client


def verify_token(token: str) -> dict:
    """Verify a Supabase access token and return its claims, or raise 401."""
    try:
        signing_key = _jwks().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=settings.issuer,
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
