import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Category, MenuItem

settings = get_settings()

ITEM_FIELDS = (
    "name",
    "description",
    "price",
    "happy_hour_price",
    "is_veg",
    "spice_level",
    "tags",
    "rating",
    "prep_time",
    "is_available",
    "image_url",
    "is_alcoholic",
)


def load_seed_data() -> dict[str, Any]:
    path = Path(settings.menu_seed_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def seed_menu(db: Session) -> None:
    data = load_seed_data()

    for category in data["categories"]:
        existing = db.get(Category, category["id"])
        if existing is None:
            db.add(
                Category(
                    id=category["id"],
                    label=category["label"],
                    sort_order=category["sort_order"],
                )
            )
        else:
            existing.label = category["label"]
            existing.sort_order = category["sort_order"]

    for item in data["items"]:
        existing = db.get(MenuItem, item["id"])
        values = {field: item[field] for field in ITEM_FIELDS}
        if existing is None:
            db.add(MenuItem(id=item["id"], category_id=item["category"], **values))
        else:
            existing.category_id = item["category"]
            for field, value in values.items():
                setattr(existing, field, value)

    db.commit()


if __name__ == "__main__":
    from app.db.init_db import init_db
    from app.db.session import SessionLocal

    init_db()
    with SessionLocal() as session:
        seed_menu(session)
    print("Menu seed applied.")
