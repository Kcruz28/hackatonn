"""Friends (connections) endpoints — GET (single), LIST, POST, DELETE.

LinkedIn-style: a Friend is a MUTUAL connection between two profiles. A connection
starts `pending` (one side sent a request) and becomes `accepted` once the other
side agrees. SKELETON: returns mock data.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict

from app.common import CURRENT_USER, ProfileSummary, mock_now, mock_profile

router = APIRouter(prefix="/friends", tags=["friends"])


# ---- Schemas ---------------------------------------------------------------

class ConnectionStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"


class FriendRequestCreate(BaseModel):
    to_name: str                                        # username to connect with


class FriendOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requester: ProfileSummary                           # who sent the request
    addressee: ProfileSummary                           # who received it
    status: ConnectionStatus
    created_at: datetime


# ---- Mock helpers (replace with DB queries) --------------------------------

def mock_friend(
    connection_id: int,
    requester: str = CURRENT_USER,
    addressee: str = "sample_user",
    status_: ConnectionStatus = ConnectionStatus.accepted,
) -> FriendOut:
    return FriendOut(
        id=connection_id,
        requester=mock_profile(requester),
        addressee=mock_profile(addressee),
        status=status_,
        created_at=mock_now(),
    )


# ---- Endpoints -------------------------------------------------------------

@router.get("", response_model=List[FriendOut])
def list_friends(
    profile: Optional[str] = Query(default=None, description="Whose connections to list (defaults to current user)"),
    status: Optional[ConnectionStatus] = Query(default=None, description="Filter by pending/accepted"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    """LIST a profile's connections. Defaults to the current user's connections."""
    return [mock_friend(i + 1, addressee=f"friend_{i + 1}") for i in range(min(limit, 3))]


@router.get("/{connection_id}", response_model=FriendOut)
def get_friend(connection_id: int):
    """GET a single connection."""
    return mock_friend(connection_id)


@router.post("", response_model=FriendOut, status_code=status.HTTP_201_CREATED)
def create_friend_request(payload: FriendRequestCreate):
    """POST a connection request from the current user to `to_name` (status=pending)."""
    if payload.to_name == CURRENT_USER:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    return mock_friend(
        connection_id=1,
        requester=CURRENT_USER,
        addressee=payload.to_name,
        status_=ConnectionStatus.pending,
    )


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friend(connection_id: int):
    """DELETE a connection — withdraw a request, decline one, or remove a friend."""
    if connection_id <= 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return None
