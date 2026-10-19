import re
from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, MenuItem
from app.schemas.menu import CategoryCreate, MenuItemCreate, MenuItemUpdate

ModelT = TypeVar("ModelT", Category, MenuItem)


class MenuValidationError(ValueError):
    """Raised when a menu write references invalid data."""


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "item"


def _unique_id(db: Session, model: type[ModelT], base: str) -> str:
    candidate = base
    suffix = 2
    while db.get(model, candidate) is not None:
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate


class MenuService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_categories(self) -> list[Category]:
        statement = select(Category).order_by(Category.sort_order, Category.id)
        return list(self.db.scalars(statement))

    def list_items(
        self,
        *,
        category: str | None = None,
        veg: bool | None = None,
        max_price: int | None = None,
        search: str | None = None,
    ) -> list[MenuItem]:
        statement = select(MenuItem)
        if category is not None:
            statement = statement.where(MenuItem.category_id == category)
        if veg is not None:
            statement = statement.where(MenuItem.is_veg == veg)
        if max_price is not None:
            statement = statement.where(MenuItem.price.is_not(None), MenuItem.price <= max_price)
        if search:
            term = f"%{search.strip()}%"
            statement = statement.where(
                MenuItem.name.ilike(term) | MenuItem.description.ilike(term)
            )
        statement = statement.order_by(MenuItem.name)
        return list(self.db.scalars(statement))

    def get_item(self, item_id: str) -> MenuItem | None:
        return self.db.get(MenuItem, item_id)

    def create_category(self, payload: CategoryCreate) -> Category:
        category = Category(
            id=_unique_id(self.db, Category, _slugify(payload.label)),
            label=payload.label,
            sort_order=payload.sort_order,
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def create_item(self, payload: MenuItemCreate) -> MenuItem:
        if self.db.get(Category, payload.category_id) is None:
            raise MenuValidationError(f"Unknown category: {payload.category_id}")
        item = MenuItem(
            id=_unique_id(self.db, MenuItem, _slugify(payload.name)),
            **payload.model_dump(),
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update_item(self, item: MenuItem, payload: MenuItemUpdate) -> MenuItem:
        changes = payload.model_dump(exclude_unset=True)
        category_id = changes.get("category_id")
        if category_id is not None and self.db.get(Category, category_id) is None:
            raise MenuValidationError(f"Unknown category: {category_id}")
        for field, value in changes.items():
            setattr(item, field, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete_item(self, item: MenuItem) -> None:
        self.db.delete(item)
        self.db.commit()
