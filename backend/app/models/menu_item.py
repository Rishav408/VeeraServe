from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category_id: Mapped[str] = mapped_column(
        ForeignKey("categories.id"), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    happy_hour_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_veg: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    spice_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    prep_time: Mapped[str | None] = mapped_column(String(40), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_alcoholic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    category: Mapped["Category"] = relationship(back_populates="items")  # noqa: F821
