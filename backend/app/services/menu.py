from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, MenuItem


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
