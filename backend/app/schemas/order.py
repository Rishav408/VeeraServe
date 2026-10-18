from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    menu_item_id: str = Field(min_length=1)
    quantity: int = Field(ge=1, le=50)
    customisations: list[str] = Field(default_factory=list)


class OrderCreate(BaseModel):
    table_number: int | None = Field(default=None, ge=1, le=999)
    payment_method: str = Field(min_length=1, max_length=20)
    instructions: str | None = Field(default=None, max_length=500)
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=20)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    menu_item_id: str
    quantity: int
    unit_price: int
    customisations: list[str]


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    table_number: int | None
    status: str
    subtotal: int
    gst: int
    discount: int
    total: int
    payment_method: str | None
    instructions: str | None
    created_at: datetime
    items: list[OrderItemOut]
