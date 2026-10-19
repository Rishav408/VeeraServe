"""LangGraph state shared across agent nodes."""

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    session_id: str
    user_id: int | None
    user_message: str
    image_query: str | None
    intent: str
    retrieved: list[dict[str, Any]]
    tool_calls: list[dict[str, Any]]
    tool_results: list[dict[str, Any]]
    cart: list[dict[str, Any]]
    offer_code: str | None
    pending_confirmation: dict[str, Any] | None
    pending_preference: dict[str, Any] | None
    memory: dict[str, Any]
    history: list[dict[str, str]]
    reply: str
    blocked: bool
