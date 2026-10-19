from uuid import uuid4

import chromadb
import pytest

from app.rag.ingest import ensure_menu_indexed, ingest_items, render_item

ITEMS = [
    {
        "id": "chai",
        "name": "Masala Chai",
        "category": "beverages",
        "price": 50,
        "is_veg": True,
        "spice_level": 1,
        "tags": ["hot"],
    },
    {
        "id": "paneer-tikka",
        "name": "Paneer Tikka",
        "category": "starters",
        "price": 220,
        "is_veg": True,
        "spice_level": 2,
        "tags": [],
    },
    {
        "id": "butter-chicken",
        "name": "Butter Chicken",
        "category": "mains",
        "price": 320,
        "is_veg": False,
        "spice_level": 2,
        "tags": ["creamy"],
    },
]


def _embed(texts: list[str]) -> list[list[float]]:
    return [[float(len(text) % 7), 1.0, 0.0] for text in texts]


@pytest.fixture()
def collection():
    client = chromadb.EphemeralClient()
    return client.get_or_create_collection(
        name=f"menu_test_{uuid4().hex}",
        metadata={"hnsw:space": "cosine"},
    )


def test_render_item_includes_price_and_diet_flags() -> None:
    rendered = render_item(ITEMS[0])

    assert "Masala Chai" in rendered
    assert "₹50" in rendered
    assert "veg" in rendered


def test_ingest_is_idempotent(collection) -> None:
    ingest_items(collection, ITEMS, embed_fn=_embed)
    ingest_items(collection, ITEMS, embed_fn=_embed)

    assert collection.count() == len(ITEMS)


def test_ingest_removes_stale_items(collection) -> None:
    ingest_items(collection, ITEMS, embed_fn=_embed)
    ingest_items(collection, ITEMS[:2], embed_fn=_embed)

    assert collection.count() == 2
    assert "butter-chicken" not in collection.get(include=[])["ids"]


def test_ensure_menu_indexed_skips_unchanged_seed(collection) -> None:
    assert ensure_menu_indexed(collection=collection, items=ITEMS, version="1", embed_fn=_embed)
    assert not ensure_menu_indexed(collection=collection, items=ITEMS, version="1", embed_fn=_embed)
    assert ensure_menu_indexed(collection=collection, items=ITEMS, version="2", embed_fn=_embed)
