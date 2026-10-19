"""OpenAI-compatible client for the local LM Studio server."""

from functools import lru_cache

from openai import OpenAI

from app.core.config import get_settings


class LLMError(RuntimeError):
    """Raised when the local model runtime cannot answer a request."""


@lru_cache
def _get_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        timeout=settings.llm_request_timeout_seconds,
    )


def chat_completion(
    prompt: str,
    *,
    system_prompt: str | None = None,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> str:
    """Send a single prompt to the local chat model and return its text reply."""
    settings = get_settings()
    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        response = _get_client().chat.completions.create(
            model=model or settings.llm_chat_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except Exception as exc:
        raise LLMError(f"Local model request failed: {exc}") from exc

    return response.choices[0].message.content or ""


def embed_texts(texts: list[str], *, model: str | None = None) -> list[list[float]]:
    """Embed texts with the local embedding model, preserving input order."""
    settings = get_settings()
    try:
        response = _get_client().embeddings.create(
            model=model or settings.llm_embedding_model,
            input=texts,
        )
    except Exception as exc:
        raise LLMError(f"Local embedding request failed: {exc}") from exc

    return [item.embedding for item in response.data]
