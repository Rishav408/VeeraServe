from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    order_id: int | None = None
    food_rating: int = Field(ge=1, le=5)
    service_rating: int = Field(ge=1, le=5)
    ai_rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    order_id: int | None
    food_rating: int
    service_rating: int
    ai_rating: int
    comment: str | None
    acknowledged: bool
    created_at: datetime
