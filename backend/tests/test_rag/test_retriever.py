from uuid import uuid4

import chromadb
import pytest
from sqlalchemy import select

from app.models import MenuItem
from app.rag.retriever import retrieve_menu_items


def _embed(texts: list[str]) -> list[list[float]]:
    return [[1.0, 0.0, 0.0] for _ in texts]


@pytest.fixture()
def collection():
    client = chromadb.EphemeralClient()
    return client.get_or_create_collection(
        name=f"retrieve_test_{uuid4().hex}",
        metadata={"hnsw:space": "cosine"},
    )


def test_retrieval_returns_only_items_that_exist_in_the_database(db, collection) -> None:
    real = db.scalars(select(MenuItem)).first()
    assert real is not None

    collection.upsert(
        ids=[real.id, "ghost-item"],
        embeddings=_embed(["real", "invented"]),
        documents=["a real dish", "an invented dish"],
        metadatas=[
            {"category": real.category_id, "is_veg": real.is_veg},
            {"category": "fake", "is_veg": True},
        ],
    )

    results = retrieve_menu_items(
        "something spicy", db=db, collection=collection, top_k=5, embed_fn=_embed
    )

    returned_ids = {item.id for item in results}
    assert returned_ids
    assert "ghost-item" not in returned_ids
    assert all(db.get(MenuItem, item_id) is not None for item_id in returned_ids)


def test_retrieval_applies_structured_filters(db, collection) -> None:
    items = list(db.scalars(select(MenuItem).limit(20)))
    assert items

    collection.upsert(
        ids=[item.id for item in items],
        embeddings=_embed([item.name for item in items]),
        documents=[item.name for item in items],
        metadatas=[{"category": item.category_id, "is_veg": item.is_veg} for item in items],
    )

    veg_results = retrieve_menu_items(
        "dinner", db=db, collection=collection, top_k=20, is_veg=True, embed_fn=_embed
    )

    assert veg_results
    assert all(item.is_veg for item in veg_results)
