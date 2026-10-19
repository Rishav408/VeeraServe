"""Strict argument/result schemas for agent tools."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import get_settings


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ToolResult(BaseModel):
    ok: bool
    data: dict[str, Any] | None = None
    error: str | None = None
    recoverable: bool = True


class SearchMenuArgs(StrictModel):
    query: str | None = None
    category: str | None = None
    is_veg: bool | None = None
    max_spice: int | None = Field(default=None, ge=0, le=4)
    max_price: int | None = Field(default=None, ge=0)


class GetItemArgs(StrictModel):
    item_id: str = Field(min_length=1)


class GetRecommendationsArgs(StrictModel):
    dietary: str | None = None
    spice_pref: int | None = Field(default=None, ge=0, le=4)
    budget: int | None = Field(default=None, ge=0)


class AddToCartArgs(StrictModel):
    item_id: str = Field(min_length=1)
    quantity: int = Field(default=1, ge=1, le=50)
    customisations: list[str] = Field(default_factory=list)


class UpdateCartArgs(StrictModel):
    item_id: str = Field(min_length=1)
    quantity: int = Field(ge=0, le=50)


class ApplyOfferArgs(StrictModel):
    code: str = Field(min_length=1)


class PlaceOrderArgs(StrictModel):
    table_number: int | None = Field(default=None, ge=1, le=999)
    payment_method: str = "cash"
    instructions: str | None = Field(default=None, max_length=500)

    @field_validator("payment_method")
    @classmethod
    def _validate_payment_method(cls, value: str) -> str:
        allowed = get_settings().payment_methods
        if value not in allowed:
            raise ValueError(f"payment_method must be one of {allowed}")
        return value


class GetOrderStatusArgs(StrictModel):
    order_id: int | None = Field(default=None, ge=1)


class BookTableArgs(StrictModel):
    party_size: int = Field(ge=1, le=50)
    time: datetime
    name: str | None = Field(default=None, max_length=120)


class EmptyArgs(StrictModel):
    pass
