"""Entry point for running the agent graph."""

from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.agent.graph import build_graph

_GRAPH = build_graph()

LLM = Callable[[str, str | None], str]


def run_agent(
    db: Session,
    message: str,
    *,
    session_id: str = "default",
    user_id: int | None = None,
    image_query: str | None = None,
    llm: LLM | None = None,
) -> dict[str, Any]:
    """Run one conversational turn, persisting session state via the checkpointer."""
    initial: dict[str, Any] = {
        "session_id": session_id,
        "user_id": user_id,
        "user_message": message,
        "image_query": image_query,
    }
    config = {"configurable": {"thread_id": session_id, "db": db, "llm": llm}}
    return dict(_GRAPH.invoke(initial, config=config))
