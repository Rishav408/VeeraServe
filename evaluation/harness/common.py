"""Shared setup and helpers for the evaluation harness."""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
DATASETS_DIR = ROOT / "evaluation" / "datasets"
RESULTS_DIR = ROOT / "evaluation" / "results"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
os.environ.setdefault("MENU_SEED_PATH", str(ROOT / "data" / "menu.seed.json"))
os.environ.setdefault("VECTOR_STORE_PATH", str(ROOT / "chroma_db"))

import app.models  # noqa: E402,F401  (registers every model on Base.metadata)
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.seed import seed_menu  # noqa: E402
from app.models import MenuItem, User  # noqa: E402

EVAL_USER_EMAIL = "eval@veeraserve.local"


def load_dataset(name: str) -> dict[str, Any]:
    path = DATASETS_DIR / f"{name}.json"
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def build_database() -> Session:
    """Return a fresh in-memory database seeded from the canonical menu."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = factory()
    seed_menu(session)
    return session


def ensure_user(db: Session, email: str = EVAL_USER_EMAIL) -> int:
    user = User(name="eval", email=email, password_hash="eval-only", role="user")
    db.add(user)
    db.commit()
    return user.id


def menu_prices(db: Session) -> set[int]:
    prices: set[int] = set()
    for item in db.query(MenuItem).all():
        for value in (item.price, item.happy_hour_price):
            if value is not None:
                prices.add(int(value))
    return prices


def load_grounding_items(db: Session) -> list[dict[str, Any]]:
    """Expand the dataset's item references into concrete questions and targets."""
    dataset = load_dataset("grounding")
    templates = dataset["templates"]
    items: list[dict[str, Any]] = []

    for entry in dataset["positive"]:
        item = db.get(MenuItem, entry["item_id"])
        if item is None:
            raise KeyError(f"Grounding dataset references unknown item: {entry['item_id']}")
        items.append(
            {
                "id": entry["id"],
                "kind": entry["kind"],
                "question": templates[entry["kind"]].format(name=item.name),
                "answerable": True,
                "must_include": item.name,
                "expected_price": item.price,
            }
        )

    for entry in dataset["negative"]:
        items.append(
            {
                "id": entry["id"],
                "kind": "negative",
                "question": entry["question"],
                "answerable": False,
                "must_not_include": entry["dish"],
            }
        )

    return items


def git_revision() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except Exception:
        return "unknown"


def write_result(name: str, payload: dict[str, Any]) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    payload.setdefault("generated_at", datetime.now(timezone.utc).isoformat())
    payload.setdefault("git_revision", git_revision())
    path = RESULTS_DIR / f"{name}.json"
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    return path


def ratio(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0
