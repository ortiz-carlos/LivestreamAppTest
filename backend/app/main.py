from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers import broadcasts
from backend.app.ws.scoreboard import router as scoreboard_router
from backend.app.ws.chat import router as chat_router
from backend.app.routers.auth import router as auth_router


app = FastAPI()

app.include_router(chat_router)
app.include_router(scoreboard_router)
app.include_router(auth_router)
app.include_router(broadcasts.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Or settings.FRONTEND_ORIGIN if you're using a config file
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
