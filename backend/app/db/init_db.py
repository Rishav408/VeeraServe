from sqlalchemy import inspect
from sqlalchemy.engine import Connection

from app.db.base import Base
from app.db.session import engine

COLUMN_BACKFILLS: dict[str, dict[str, str]] = {
    "feedback": {"acknowledged": "ALTER TABLE feedback ADD COLUMN acknowledged BOOLEAN NOT NULL DEFAULT 0"},
}


def _backfill_columns(connection: Connection) -> None:
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    for table, columns in COLUMN_BACKFILLS.items():
        if table not in tables:
            continue
        existing = {column["name"] for column in inspector.get_columns(table)}
        for name, statement in columns.items():
            if name not in existing:
                connection.exec_driver_sql(statement)


def init_db() -> None:
    import app.models  # noqa: F401  (ensures every model is registered on Base.metadata)

    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        _backfill_columns(connection)
