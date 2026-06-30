"""SQLAlchemy engine, session factory, declarative Base, and the get_db dependency."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

# Serverless-friendly: NullPool opens a fresh connection per request (real pooling
# is handled by Supabase's transaction pooler on :6543), so ephemeral function
# instances don't pile up idle connections. pool_pre_ping avoids dead connections.
engine = create_engine(settings.DATABASE_URL, poolclass=NullPool, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
