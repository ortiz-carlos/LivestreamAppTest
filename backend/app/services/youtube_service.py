### services/youtube_service.py
from fastapi import HTTPException
from datetime import datetime
from models.broadcast_models import BroadcastRequest, BroadcastResponse
from youtube_utils import (
    schedule_broadcast,
    get_scheduled_broadcasts,
    update_broadcast as youtube_update_broadcast,
    delete_broadcast as youtube_delete_broadcast,
    get_current_broadcast
)
import logging

logger = logging.getLogger(__name__)


def list_youtube_broadcasts():
    try:
        broadcasts = get_scheduled_broadcasts()
        if broadcasts is None:
            raise HTTPException(status_code=500, detail="Failed to fetch broadcasts from YouTube")
        return broadcasts
    except Exception as e:
        logger.error(f"Failed to fetch broadcasts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch broadcasts")


def create_youtube_broadcast(request: BroadcastRequest):
    try:
        logger.info(f"Creating broadcast: {request}")
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
        logger.error(f"Failed to create broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def update_youtube_broadcast(broadcast_id: str, request: BroadcastRequest):
    try:
        year = datetime.utcnow().year
        scheduled_start = datetime(
            year=year,
            month=request.month,
            day=request.day,
            hour=int(request.time.split(":")[0]),
            minute=int(request.time.split(":")[1])
        )

        updated_broadcast = youtube_update_broadcast(
            broadcast_id=broadcast_id,
            title=request.title,
            scheduled_start=scheduled_start
        )

        if not updated_broadcast:
            raise HTTPException(status_code=500, detail="Failed to update broadcast")

        return updated_broadcast
    except Exception as e:
        logger.error(f"Failed to update broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def delete_youtube_broadcast(broadcast_id: str):
    try:
        success = youtube_delete_broadcast(broadcast_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete broadcast")
        return {"message": "Broadcast deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_youtube_live_url():
    try:
        current = get_current_broadcast()
        if current:
            return current["url"]
        return "No livestream available."
    except Exception as e:
        logger.error(f"Failed to get live URL: {e}")
        return "No livestream available."