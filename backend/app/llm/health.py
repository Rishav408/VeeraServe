"""Readiness probe for the local LM Studio server."""

from dataclasses import dataclass

import httpx

from app.core.config import get_settings
from app.llm.client import _get_client


@dataclass(frozen=True)
class LLMStatus:
    available: bool
    model_id: str | None = None
    context_length: int | None = None
    detail: str | None = None


def _native_models_url() -> str:
    root = get_settings().llm_base_url.rstrip("/")
    if root.endswith("/v1"):
        root = root[: -len("/v1")]
    return f"{root}/api/v0/models"


def _fetch_native_models() -> dict:
    response = httpx.get(_native_models_url(), timeout=5.0)
    response.raise_for_status()
    return response.json()


def probe_llm() -> LLMStatus:
    """Report whether LM Studio is reachable and which model it has loaded."""
    settings = get_settings()

    try:
        listing = _get_client().models.list()
    except Exception as exc:
        return LLMStatus(available=False, detail=str(exc))

    model_ids = [
        entry.id for entry in getattr(listing, "data", []) or [] if getattr(entry, "id", None)
    ]
    if not model_ids:
        return LLMStatus(available=False, detail="No model loaded in LM Studio")

    preferred = settings.llm_chat_model
    model_id = preferred if preferred in model_ids else model_ids[0]

    context_length = settings.llm_context_length
    try:
        native = _fetch_native_models()
    except Exception:
        native = {}
    for entry in native.get("data", []) if isinstance(native, dict) else []:
        if entry.get("id") == model_id:
            context_length = entry.get("max_context_length") or context_length
            break

    return LLMStatus(available=True, model_id=model_id, context_length=context_length)
