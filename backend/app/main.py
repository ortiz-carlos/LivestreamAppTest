from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, StringConstraints
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from youtube_utils import schedule_broadcast
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi import Body


app = FastAPI()

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

scoreboard = {"home": 0, "away": 0}
clients = []

class ScoreUpdate(BaseModel):
    team: str
    points: int

@app.post("/score/update")
async def update_score(update: ScoreUpdate):
    if update.team not in scoreboard:
        return JSONResponse(status_code=400, content={"error": "Invalid team"})

    scoreboard[update.team] += update.points
    print(f"[UPDATE] {update.team} +{update.points} → {scoreboard}")

    # Notify all connected clients
    for ws in clients:
        try:
            await ws.send_json(scoreboard)
        except Exception as e:
            print(f"[ERROR] Failed to notify client: {e}")

    return scoreboard


@app.websocket("/ws/score")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Client connected.")
    clients.append(websocket)

    try:
        # Send the current score right away
        await websocket.send_json(scoreboard)

        # Keep the connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("[WS] Client disconnected.")
        clients.remove(websocket)


@app.post("/broadcast")
def create_broadcast(request: BroadcastRequest):
    try:
        print(f"[DEBUG] Got request: {request}")
        broadcast_id, youtube_url = schedule_broadcast(
            title=request.title,
            month=request.month,
            day=request.day,
            time_str=request.time
        )
        print(f"[DEBUG] Result: {broadcast_id}, {youtube_url}")

        if not broadcast_id:
            raise HTTPException(status_code=500, detail="Broadcast creation failed.")

        return {"id": broadcast_id, "url": youtube_url}
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import PlainTextResponse

@app.get("/live_url", response_class=PlainTextResponse)
def get_live_url():
    try:
        with open("live_url.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "No livestream available."
