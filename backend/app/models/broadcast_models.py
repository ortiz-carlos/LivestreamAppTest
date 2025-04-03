### models/broadcast_models.py
from pydantic import BaseModel, StringConstraints
from typing import Annotated

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