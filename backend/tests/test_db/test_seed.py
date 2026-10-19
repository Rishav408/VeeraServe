from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.db.base import Base
from app.db.seed import seed_menu
from app.models import Category, MenuItem
from app.services.menu import MenuService


@pytest.fixture()
def db() -> Iterator[Session]:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_seed_is_idempotent(db: Session) -> None:
    seed_menu(db)
    first_categories = db.scalar(select(func.count()).select_from(Category))
    first_items = db.scalar(select(func.count()).select_from(MenuItem))

    seed_menu(db)
    second_categories = db.scalar(select(func.count()).select_from(Category))
    second_items = db.scalar(select(func.count()).select_from(MenuItem))

    assert first_categories == second_categories
    assert first_items == second_items
    assert first_categories > 0
    assert first_items > 0


def test_seed_preserves_existing_items(db: Session) -> None:
    seed_menu(db)
    item = db.scalars(select(MenuItem)).first()
    assert item is not None
    item.price = 1234
    item.is_available = False
    db.commit()

    seed_menu(db)

    db.refresh(item)
    assert item.price == 1234
    assert item.is_available is False


def test_menu_service_filters(db: Session) -> None:
    seed_menu(db)
    service = MenuService(db)

    assert len(service.list_categories()) > 0

    veg_items = service.list_items(veg=True)
    assert veg_items and all(item.is_veg for item in veg_items)

    affordable = service.list_items(max_price=100)
    assert all(item.price is not None and item.price <= 100 for item in affordable)

    matches = service.list_items(search="mac")
    assert matches and all("mac" in (item.name + " " + (item.description or "")).lower() for item in matches)

    assert service.get_item(veg_items[0].id) is not None
    assert service.get_item("does-not-exist") is None
