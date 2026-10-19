import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import User
from app.rag.ingest import reindex_menu
from app.schemas.menu import (
    CategoryCreate,
    CategoryOut,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
)
from app.services.menu import MenuService, MenuValidationError

logger = logging.getLogger(__name__)

router = APIRouter()


def _reindex(db: Session) -> None:
    try:
        reindex_menu(db)
    except Exception as exc:
        logger.warning("Menu re-index skipped: %s", exc)


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    return MenuService(db).list_categories()


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> CategoryOut:
    return MenuService(db).create_category(payload)


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


@router.post("/menu", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> MenuItemOut:
    try:
        item = MenuService(db).create_item(payload)
    except MenuValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _reindex(db)
    return item


@router.get("/menu/{item_id}", response_model=MenuItemOut)
def get_menu_item(item_id: str, db: Session = Depends(get_db)) -> MenuItemOut:
    item = MenuService(db).get_item(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


@router.patch("/menu/{item_id}", response_model=MenuItemOut)
def update_menu_item(
    item_id: str,
    payload: MenuItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> MenuItemOut:
    service = MenuService(db)
    item = service.get_item(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    try:
        updated = service.update_item(item, payload)
    except MenuValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _reindex(db)
    return updated


@router.delete("/menu/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    item_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> Response:
    service = MenuService(db)
    item = service.get_item(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    service.delete_item(item)
    _reindex(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
