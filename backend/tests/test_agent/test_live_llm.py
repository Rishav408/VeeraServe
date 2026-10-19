"""Live-endpoint scenario checks.

These run headless **against a real LM Studio** instance and are opt-in: set
`VEERASERVE_LIVE_LLM=1` (and have the server up) to execute them. They are skipped in the
default suite, which stays deterministic and offline.
"""

import os

import pytest
from sqlalchemy import select

from app.agent import polish as polish_module
from app.agent.runner import run_agent
from app.llm.health import probe_llm
from app.models import MenuItem, Order
from app.rag.ingest import ensure_menu_indexed
from app.rag.retriever import retrieve_menu_items

pytestmark = pytest.mark.skipif(
    not os.getenv("VEERASERVE_LIVE_LLM"),
    reason="set VEERASERVE_LIVE_LLM=1 with LM Studio running to run live checks",
)


@pytest.fixture()
def live_item(db) -> MenuItem:
    item = db.scalars(
        select(MenuItem).where(MenuItem.price.is_not(None), MenuItem.is_available.is_(True))
    ).first()
    assert item is not None
    return item


def _require_llm() -> None:
    status = probe_llm()
    if not status.available:
        pytest.skip(f"LM Studio not available: {status.detail}")


def test_live_polish_stays_grounded(db, live_item: MenuItem) -> None:
    _require_llm()
    context = [{"name": live_item.name, "is_veg": live_item.is_veg, "price": live_item.price}]
    draft = f"I can recommend {live_item.name} for ₹{live_item.price}."

    polished = polish_module.polish_reply(draft, context)

    assert polish_module.verify_grounded(polished, context)


def test_live_retrieval_finds_a_real_dish(db, live_item: MenuItem) -> None:
    _require_llm()
    ensure_menu_indexed()

    results = retrieve_menu_items(live_item.name, db=db)

    assert any(result.id == live_item.id for result in results)


def test_live_order_scenario_completes(db, live_item: MenuItem) -> None:
    _require_llm()
    session = "live-scenario"

    staged = run_agent(db, f"order 1 {live_item.name}", session_id=session)
    assert staged.get("pending_confirmation") is not None

    placed = run_agent(db, "yes", session_id=session)
    assert "placed" in (placed.get("reply") or "").lower()
    assert db.scalars(select(Order)).first() is not None
