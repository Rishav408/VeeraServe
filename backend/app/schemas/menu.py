from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    sort_order: int


class MenuItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category_id: str
    description: str | None = None
    price: int | None = None
    happy_hour_price: int | None = None
    is_veg: bool
    spice_level: int
    tags: list[str]
    rating: float | None = None
    prep_time: str | None = None
    is_available: bool
    image_url: str | None = None
    is_alcoholic: bool
