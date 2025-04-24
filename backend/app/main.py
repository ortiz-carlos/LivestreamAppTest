### main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import broadcasts
from ws.scoreboard import router as scoreboard_router
from auth import router as auth_router
from ws.chat import router as chat_router


app = FastAPI()
app.include_router(chat_router)
app.include_router(scoreboard_router)
app.include_router(auth_router)

app.include_router(broadcasts.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)