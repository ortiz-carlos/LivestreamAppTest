from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, StringConstraints
from typing import Annotated, List
from fastapi.middleware.cors import CORSMiddleware
from youtube_utils import (
    schedule_broadcast,
    get_scheduled_broadcasts,
    update_broadcast as youtube_update_broadcast,
    delete_broadcast as youtube_delete_broadcast,
    get_current_broadcast
)
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi import Body
from ws.scoreboard import router as scoreboard_router
from datetime import datetime

app = FastAPI()
app.include_router(scoreboard_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BroadcastRequest(BaseModel):
    title: Annotated[str, StringConstraints(min_length=1)]
    month: int
    day: int
    time: Annotated[str, StringConstraints(pattern=r"^\d{2}:\d{2}$")]
    description: str = ""

class BroadcastResponse(BaseModel):
    id: str
    title: str
    description: str
    date: str
    time: str
    url: str

@app.get("/broadcasts", response_model=List[BroadcastResponse])
def list_broadcasts():
    """Fetch all scheduled broadcasts from YouTube."""
    try:
        broadcasts = get_scheduled_broadcasts()
        if broadcasts is None:
            raise HTTPException(status_code=500, detail="Failed to fetch broadcasts from YouTube")
        return broadcasts
    except Exception as e:
        print(f"[ERROR] Failed to fetch broadcasts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch broadcasts")

@app.post("/broadcast", response_model=BroadcastResponse)
def create_broadcast(request: BroadcastRequest):
    """Create a new broadcast on YouTube."""
    try:
        print(f"[DEBUG] Creating broadcast: {request}")
        broadcast_id, youtube_url = schedule_broadcast(
            title=request.title,
            month=request.month,
            day=request.day,
            time_str=request.time,
            description=request.description
        )
        print(f"[DEBUG] Created broadcast: {broadcast_id}, {youtube_url}")

        if not broadcast_id:
            raise HTTPException(status_code=500, detail="Broadcast creation failed")

        # Format the date for response
        year = datetime.utcnow().year
        date_str = f"{year}-{request.month:02d}-{request.day:02d}"

        return {
            "id": broadcast_id,
            "title": request.title,
            "description": request.description,
            "date": date_str,
            "time": request.time,
            "url": youtube_url
        }
    except Exception as e:
        print(f"[ERROR] Failed to create broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/broadcast/{broadcast_id}", response_model=BroadcastResponse)
def update_broadcast(broadcast_id: str, request: BroadcastRequest):
    """Update an existing broadcast on YouTube."""
    try:
        # Create datetime object for the scheduled start
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
        print(f"[ERROR] Failed to update broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/broadcast/{broadcast_id}")
def delete_broadcast(broadcast_id: str):
    """Delete a broadcast from YouTube."""
    try:
        success = youtube_delete_broadcast(broadcast_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete broadcast")
        return {"message": "Broadcast deleted successfully"}
    except Exception as e:
        print(f"[ERROR] Failed to delete broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/live_url", response_class=PlainTextResponse)
def get_live_url():
    """Get the current live broadcast URL."""
    try:
        current = get_current_broadcast()
        if current:
            return current["url"]
        return "No livestream available."
    except Exception as e:
        print(f"[ERROR] Failed to get live URL: {e}")
        return "No livestream available."
