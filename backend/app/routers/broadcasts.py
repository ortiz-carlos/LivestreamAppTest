### routers/broadcasts.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from typing import List
from datetime import datetime
from models.broadcast_models import BroadcastRequest, BroadcastResponse
from services.youtube_utils import (
    schedule_broadcast,
    get_scheduled_broadcasts,
    update_broadcast as youtube_update_broadcast,
    delete_broadcast as youtube_delete_broadcast,
    get_current_broadcast
)

router = APIRouter()

@router.get("/broadcasts", response_model=List[BroadcastResponse])
def list_broadcasts():
    try:
        broadcasts = get_scheduled_broadcasts()
        return broadcasts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch broadcasts")

@router.post("/broadcast", response_model=BroadcastResponse)
def create_broadcast(request: BroadcastRequest):
    try:
        broadcast_id, youtube_url = schedule_broadcast(
            title=request.title,
            month=request.month,
            day=request.day,
            time_str=request.time,
            description=request.description
        )

        if not broadcast_id:
            raise HTTPException(status_code=500, detail="Broadcast creation failed")

        year = datetime.utcnow().year
        date_str = f"{year}-{request.month:02d}-{request.day:02d}"

        return BroadcastResponse(
            id=broadcast_id,
            title=request.title,
            description=request.description,
            date=date_str,
            time=request.time,
            url=youtube_url
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/broadcast/{broadcast_id}", response_model=BroadcastResponse)
def update_broadcast(broadcast_id: str, request: BroadcastRequest):
    try:
        year = datetime.utcnow().year
        scheduled_start = datetime(
            year=year,
            month=request.month,
            day=request.day,
            hour=int(request.time.split(":")[0]),
            minute=int(request.time.split(":")[1])
        )

        updated = youtube_update_broadcast(
            broadcast_id=broadcast_id,
            title=request.title,
            scheduled_start=scheduled_start
        )

        if not updated:
            raise HTTPException(status_code=500, detail="Failed to update broadcast")

        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/broadcast/{broadcast_id}")
def delete_broadcast(broadcast_id: str):
    try:
        success = youtube_delete_broadcast(broadcast_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete broadcast")
        return {"message": "Broadcast deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/live_url", response_class=PlainTextResponse)
def get_live_url():
    try:
        current = get_current_broadcast()
        return current["url"] if current else "No livestream available."
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve livestream URL")
