from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.menu import CategoryOut, MenuItemOut
from app.services.menu import MenuService

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    return MenuService(db).list_categories()


@router.get("/menu", response_model=list[MenuItemOut])
def list_menu(
    category: str | None = None,
    veg: bool | None = None,
    max_price: int | None = Query(default=None, ge=0),
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[MenuItemOut]:
    return MenuService(db).list_items(
        category=category,
        veg=veg,
        max_price=max_price,
        search=search,
    )


@router.get("/menu/{item_id}", response_model=MenuItemOut)
def get_menu_item(item_id: str, db: Session = Depends(get_db)) -> MenuItemOut:
    item = MenuService(db).get_item(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item
