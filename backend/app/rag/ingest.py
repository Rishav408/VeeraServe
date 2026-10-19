"""Render the menu into the local vector store (Chroma)."""

import json
import logging
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any

import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.llm.client import embed_texts

logger = logging.getLogger(__name__)

EmbedFn = Callable[[list[str]], list[list[float]]]
LIVE_VERSION = "live"


def get_store(path: str | None = None) -> ClientAPI:
    settings = get_settings()
    return chromadb.PersistentClient(path=path or settings.vector_store_path)


def get_menu_collection(client: ClientAPI | None = None) -> Collection:
    settings = get_settings()
    store = client or get_store()
    return store.get_or_create_collection(
        name=settings.rag_collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def load_seed(path: str | None = None) -> tuple[str, list[dict[str, Any]]]:
    seed_path = Path(path or get_settings().menu_seed_path)
    data = json.loads(seed_path.read_text(encoding="utf-8"))
    return str(data.get("version", "")), list(data.get("items", []))


def render_item(item: dict[str, Any]) -> str:
    price = item.get("price")
    price_text = f"₹{price}" if price is not None else "price on request"
    happy_hour = item.get("happy_hour_price")
    if happy_hour is not None:
        price_text = f"{price_text} (happy hour ₹{happy_hour})"
    tags = ", ".join(item.get("tags") or []) or "none"
    veg_text = "veg" if item.get("is_veg", True) else "non-veg"
    description = (item.get("description") or "").strip()
    rendered = (
        f"{item['name']}. Category: {item.get('category')}. "
        f"Price: {price_text}. {veg_text}, spice {item.get('spice_level', 0)}/4. "
        f"Tags: {tags}."
    )
    if description:
        rendered = f"{rendered} {description}"
    return rendered


def _metadata(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": str(item["name"]),
        "category": str(item.get("category", "")),
        "is_veg": bool(item.get("is_veg", True)),
        "spice_level": int(item.get("spice_level", 0)),
        "price": int(item["price"]) if item.get("price") is not None else -1,
        "is_alcoholic": bool(item.get("is_alcoholic", False)),
    }


def ingest_items(
    collection: Collection,
    items: Sequence[dict[str, Any]],
    *,
    embed_fn: EmbedFn = embed_texts,
) -> int:
    ids = [str(item["id"]) for item in items]
    documents = [render_item(item) for item in items]
    metadatas = [_metadata(item) for item in items]

    if ids:
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embed_fn(documents),
            metadatas=metadatas,
        )

    keep = set(ids)
    stale = [existing for existing in collection.get(include=[])["ids"] if existing not in keep]
    if stale:
        collection.delete(ids=stale)

    return len(ids)


def ensure_menu_indexed(
    *,
    collection: Collection | None = None,
    items: Sequence[dict[str, Any]] | None = None,
    version: str | None = None,
    embed_fn: EmbedFn = embed_texts,
) -> bool:
    """Index the menu only when the store is empty or the seed version changed."""
    store = collection or get_menu_collection()
    if items is None or version is None:
        seed_version, seed_items = load_seed()
        version = version if version is not None else seed_version
        items = items if items is not None else seed_items
    items = list(items)

    indexed_version = (store.metadata or {}).get("seed_version")
    if store.count() == len(items) and indexed_version == version:
        return False

    ingest_items(store, items, embed_fn=embed_fn)
    updated = dict(store.metadata or {})
    updated.pop("hnsw:space", None)
    updated["seed_version"] = version
    store.modify(metadata=updated)
    logger.info("Indexed %d menu items (seed %s)", len(items), version)
    return True


def item_to_document_dict(item: Any) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category_id,
        "price": item.price,
        "happy_hour_price": item.happy_hour_price,
        "is_veg": item.is_veg,
        "spice_level": item.spice_level,
        "tags": list(item.tags or []),
        "description": item.description,
        "is_alcoholic": item.is_alcoholic,
    }


def reindex_menu(
    db: Session,
    *,
    collection: Collection | None = None,
    embed_fn: EmbedFn = embed_texts,
) -> int:
    """Re-index the vector store from the live database (source of truth at runtime)."""
    from app.services.menu import MenuService

    store = collection or get_menu_collection()
    items = [item_to_document_dict(item) for item in MenuService(db).list_items()]
    count = ingest_items(store, items, embed_fn=embed_fn)
    updated = dict(store.metadata or {})
    updated.pop("hnsw:space", None)
    updated["seed_version"] = LIVE_VERSION
    store.modify(metadata=updated)
    logger.info("Re-indexed %d menu items from database", count)
    return count


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    ensure_menu_indexed()


if __name__ == "__main__":
    main()
