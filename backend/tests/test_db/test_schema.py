from sqlalchemy import create_engine, inspect

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.db.base import Base

EXPECTED_TABLES = {
    "categories",
    "feedback",
    "menu_items",
    "order_items",
    "orders",
    "reservations",
    "sessions",
    "users",
}


def test_schema_creates_all_tables() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    assert set(inspect(engine).get_table_names()) == EXPECTED_TABLES
