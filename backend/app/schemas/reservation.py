from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReservationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    party_size: int = Field(ge=1, le=50)
    time: datetime


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    name: str
    party_size: int
    time: datetime
    status: str
    created_at: datetime
