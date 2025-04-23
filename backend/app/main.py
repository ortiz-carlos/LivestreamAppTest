# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import broadcasts
from ws.scoreboard import router as scoreboard_router
from routers.auth import router as auth_router
from config import settings


app = FastAPI()

app.include_router(scoreboard_router)
app.include_router(auth_router)

app.include_router(broadcasts.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)