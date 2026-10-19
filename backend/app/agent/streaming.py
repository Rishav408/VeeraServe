"""Turn an agent turn into a stream of SSE-ready events."""

import json
from collections.abc import Iterator
from typing import Any

from sqlalchemy.orm import Session

from app.agent import polish as polish_module
from app.agent.runner import run_agent
from app.core.config import get_settings
from app.llm.client import LLMError
from app.llm.vision import describe_image
from app.models import ChatSession
from app.services.transcription import TranscriptionError, transcribe_audio

CART_TOOLS = frozenset({"add_to_cart", "update_cart", "place_order"})


def _chunks(text: str) -> Iterator[str]:
    words = text.split()
    for index, word in enumerate(words):
        yield word + (" " if index < len(words) - 1 else "")


def _ensure_session(db: Session, session_id: str, user_id: int | None) -> None:
    session = db.get(ChatSession, session_id)
    if session is None:
        db.add(ChatSession(id=session_id, user_id=user_id))
        db.commit()
    elif user_id is not None and session.user_id != user_id:
        session.user_id = user_id
        db.commit()


def format_sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def iter_turn_events(
    db: Session,
    *,
    session_id: str,
    user_id: int | None,
    text: str = "",
    audio: bytes | None = None,
    audio_suffix: str = ".webm",
    image: bytes | None = None,
    image_mime: str = "image/jpeg",
) -> Iterator[dict[str, Any]]:
    """Yield the events of a single conversational turn (transcript/tool/token/done)."""
    _ensure_session(db, session_id, user_id)
    yield {"type": "session", "session_id": session_id}

    message = text.strip()
    if not message and audio:
        try:
            message = transcribe_audio(audio, suffix=audio_suffix)
            yield {"type": "transcript", "text": message}
        except TranscriptionError as exc:
            yield {"type": "error", "message": str(exc)}
            yield {
                "type": "done",
                "reply": "Sorry, I couldn't understand that audio — could you type it?",
                "pending_confirmation": False,
            }
            return

    image_query: str | None = None
    if image:
        try:
            image_query = describe_image(image, mime_type=image_mime)
            yield {"type": "image", "description": image_query}
        except LLMError as exc:
            yield {"type": "error", "message": str(exc)}
            yield {
                "type": "done",
                "reply": "I couldn't read that image — tell me what you're craving and I'll help.",
                "pending_confirmation": False,
            }
            return

    if not message and not image_query:
        yield {
            "type": "done",
            "reply": "Tell me what you'd like — I can suggest dishes, place an order, or check its status.",
            "pending_confirmation": False,
        }
        return

    state = run_agent(
        db,
        message or "(image)",
        session_id=session_id,
        user_id=user_id,
        image_query=image_query,
    )
    yield {"type": "intent", "intent": state.get("intent")}

    tool_results = state.get("tool_results") or []
    for result in tool_results:
        yield {"type": "tool", "name": result.get("tool"), "ok": bool(result.get("ok"))}

    reply = state.get("reply") or ""
    if get_settings().llm_polish_enabled:
        reply = polish_module.polish_reply(reply, state.get("retrieved") or [])

    for chunk in _chunks(reply):
        yield {"type": "token", "text": chunk}

    if any(result.get("tool") in CART_TOOLS for result in tool_results):
        yield {"type": "cart", "items": state.get("cart") or []}

    yield {
        "type": "done",
        "reply": reply,
        "pending_confirmation": state.get("pending_confirmation") is not None,
    }
