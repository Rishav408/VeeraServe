from pydantic import BaseModel, ConfigDict, Field


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    sort_order: int


class CategoryCreate(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    sort_order: int = Field(default=0, ge=0)


class MenuItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    category_id: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=600)
    price: int | None = Field(default=None, ge=0)
    happy_hour_price: int | None = Field(default=None, ge=0)
    is_veg: bool = True
    spice_level: int = Field(default=0, ge=0, le=4)
    tags: list[str] = Field(default_factory=list)
    rating: float | None = Field(default=None, ge=0, le=5)
    prep_time: str | None = Field(default=None, max_length=40)
    is_available: bool = True
    image_url: str | None = Field(default=None, max_length=600)
    is_alcoholic: bool = False


class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    category_id: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=600)
    price: int | None = Field(default=None, ge=0)
    happy_hour_price: int | None = Field(default=None, ge=0)
    is_veg: bool | None = None
    spice_level: int | None = Field(default=None, ge=0, le=4)
    tags: list[str] | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    prep_time: str | None = Field(default=None, max_length=40)
    is_available: bool | None = None
    image_url: str | None = Field(default=None, max_length=600)
    is_alcoholic: bool | None = None


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
