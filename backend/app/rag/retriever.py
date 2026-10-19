"""Top-k menu retrieval with structured filters, grounded in the database."""

from dataclasses import dataclass

from chromadb.api.models.Collection import Collection
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.llm.client import embed_texts
from app.rag.ingest import EmbedFn, get_menu_collection
from app.services.menu import MenuService


@dataclass(frozen=True)
class RetrievedItem:
    id: str
    name: str
    category_id: str
    price: int | None
    is_veg: bool
    spice_level: int
    score: float | None


def retrieve_menu_items(
    query: str,
    *,
    db: Session,
    collection: Collection | None = None,
    top_k: int | None = None,
    category: str | None = None,
    is_veg: bool | None = None,
    max_price: int | None = None,
    max_spice: int | None = None,
    embed_fn: EmbedFn = embed_texts,
) -> list[RetrievedItem]:
    """Return grounded menu items: only ids that also exist in the database survive."""
    settings = get_settings()
    store = collection or get_menu_collection()

    result = store.query(
        query_embeddings=embed_fn([query]),
        n_results=top_k or settings.rag_top_k,
    )
    ids = result["ids"][0] if result.get("ids") else []
    distances = result["distances"][0] if result.get("distances") else []

    service = MenuService(db)
    retrieved: list[RetrievedItem] = []
    for position, item_id in enumerate(ids):
        item = service.get_item(item_id)
        if item is None:
            continue
        if category is not None and item.category_id != category:
            continue
        if is_veg is not None and item.is_veg != is_veg:
            continue
        if max_price is not None and (item.price is None or item.price > max_price):
            continue
        if max_spice is not None and item.spice_level > max_spice:
            continue
        score = distances[position] if position < len(distances) else None
        retrieved.append(
            RetrievedItem(
                id=item.id,
                name=item.name,
                category_id=item.category_id,
                price=item.price,
                is_veg=item.is_veg,
                spice_level=item.spice_level,
                score=score,
            )
        )
    return retrieved
