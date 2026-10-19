"""Vision pipeline: turn a photo into a short, menu-focused description."""

import base64

from app.core.config import get_settings
from app.llm.client import LLMError, _get_client

VISION_SYSTEM_PROMPT = (
    "You are a restaurant waiter. Look at the photo of food and reply with one short "
    "sentence naming the dish it most resembles. Do not invent restaurant names or prices."
)


def describe_image(
    image_bytes: bytes,
    *,
    mime_type: str = "image/jpeg",
    max_chars: int = 240,
) -> str:
    """Describe a dish photo with the local vision model; raises LLMError if unavailable."""
    settings = get_settings()
    if not image_bytes:
        raise LLMError("Empty image payload")

    data_uri = f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"
    messages = [
        {"role": "system", "content": VISION_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What dish is in this photo?"},
                {"type": "image_url", "image_url": {"url": data_uri}},
            ],
        },
    ]

    try:
        response = _get_client().chat.completions.create(
            model=settings.llm_vision_model,
            messages=messages,
            temperature=0.2,
            max_tokens=120,
        )
    except Exception as exc:
        raise LLMError(f"Vision request failed: {exc}") from exc

    description = (response.choices[0].message.content or "").strip()
    if not description:
        raise LLMError("Vision model returned no description")
    return description[:max_chars]
