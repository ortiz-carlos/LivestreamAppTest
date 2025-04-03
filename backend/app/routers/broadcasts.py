### routers/broadcasts.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from typing import List
from datetime import datetime
from models.broadcast_models import BroadcastRequest, BroadcastResponse
from services.youtube_service import (
    create_youtube_broadcast,
    update_youtube_broadcast,
    delete_youtube_broadcast,
    list_youtube_broadcasts,
    get_youtube_live_url
)

router = APIRouter()

@router.get("/broadcasts", response_model=List[BroadcastResponse])
def list_broadcasts():
    return list_youtube_broadcasts()

@router.post("/broadcast", response_model=BroadcastResponse)
def create_broadcast(request: BroadcastRequest):
    return create_youtube_broadcast(request)

@router.put("/broadcast/{broadcast_id}", response_model=BroadcastResponse)
def update_broadcast(broadcast_id: str, request: BroadcastRequest):
    return update_youtube_broadcast(broadcast_id, request)

@router.delete("/broadcast/{broadcast_id}")
def delete_broadcast(broadcast_id: str):
    return delete_youtube_broadcast(broadcast_id)

@router.get("/live_url", response_class=PlainTextResponse)
def get_live_url():
    return get_youtube_live_url()