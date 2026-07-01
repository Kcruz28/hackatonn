"""Typed application settings, loaded from backend/.env."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # Supabase Auth
    SUPABASE_URL: str                       # https://<ref>.supabase.co
    SUPABASE_ANON_KEY: str                  # publishable key (client + password grant)
    SUPABASE_SERVICE_KEY: str               # secret key (admin user creation) — backend only

    @property
    def clean_supabase_url(self) -> str:
        return self.SUPABASE_URL.rstrip("/")

    @property
    def auth_url(self) -> str:
        return f"{self.clean_supabase_url}/auth/v1"

    @property
    def jwks_url(self) -> str:
        return f"{self.clean_supabase_url}/auth/v1/.well-known/jwks.json"

    @property
    def issuer(self) -> str:
        return f"{self.clean_supabase_url}/auth/v1"


settings = Settings()  # type: ignore[call-arg]
