"""SQLAlchemy ORM models mapped to the live Supabase schema (public schema).

These mirror the tables the database team created — introspected, not invented.
We do NOT call create_all(): the DB owns the schema; we only read/write it.
Primary keys and created_at are filled server-side (gen_random_uuid() / now()),
so inserts omit them and refresh() reads them back.
"""
from __future__ import annotations

from sqlalchemy import (
    TIMESTAMP,
    Column,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid_pk() -> Column:
    return Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))


def _created_at() -> Column:
    return Column(TIMESTAMP, nullable=False, server_default=func.now())


def _profile_fk(**kwargs) -> Column:
    return Column(UUID(as_uuid=True), ForeignKey("profiles.profile_id"), **kwargs)


class Profile(Base):
    __tablename__ = "profiles"

    profile_id = _uuid_pk()
    name = Column(Text, nullable=False)
    avatar_url = Column(Text)
    created_at = _created_at()


class Recipe(Base):
    __tablename__ = "recipes"

    recipe_id = _uuid_pk()
    author_id = _profile_fk(nullable=False)
    title = Column(Text, nullable=False)
    ingredients = Column(Text)          # free text (newline-separated), per the DB
    steps = Column(Text)                # free text (newline-separated), per the DB
    image_url = Column(Text)
    cuisine = Column(Text)
    created_at = _created_at()

    author = relationship("Profile")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("author_id", "recipe_id"),)  # one review per author per recipe

    review_id = _uuid_pk()
    author_id = _profile_fk(nullable=False)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id"), nullable=False)
    stars = Column(Integer, nullable=False)
    comment = Column(Text)
    image_url = Column(Text)
    created_at = _created_at()

    author = relationship("Profile")
    recipe = relationship("Recipe")


class Follow(Base):
    __tablename__ = "follows"

    follower_id = _profile_fk(primary_key=True)
    followee_id = _profile_fk(primary_key=True)
    created_at = _created_at()

    follower = relationship("Profile", foreign_keys=[follower_id])
    followee = relationship("Profile", foreign_keys=[followee_id])


class Friendship(Base):
    __tablename__ = "friendships"

    user_a = _profile_fk(primary_key=True)
    user_b = _profile_fk(primary_key=True)
    created_at = _created_at()

    profile_a = relationship("Profile", foreign_keys=[user_a])
    profile_b = relationship("Profile", foreign_keys=[user_b])
