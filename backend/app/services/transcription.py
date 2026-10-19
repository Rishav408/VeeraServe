"""Speech-to-text via a lazily loaded faster-whisper model."""

import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import get_settings


class TranscriptionError(RuntimeError):
    """Raised when audio cannot be transcribed."""


@lru_cache
def _get_model() -> Any:
    from faster_whisper import WhisperModel

    settings = get_settings()
    return WhisperModel(
        settings.stt_model_size,
        device=settings.stt_device,
        compute_type=settings.stt_compute_type,
    )


def transcribe_audio(audio_bytes: bytes, *, suffix: str = ".webm") -> str:
    """Transcribe an audio blob to text; raises TranscriptionError when unavailable."""
    if not audio_bytes:
        raise TranscriptionError("Empty audio payload")

    try:
        model = _get_model()
    except Exception as exc:
        raise TranscriptionError(f"Speech-to-text model unavailable: {exc}") from exc

    path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
            handle.write(audio_bytes)
            path = handle.name
        segments, _info = model.transcribe(path)
        return " ".join(segment.text.strip() for segment in segments).strip()
    except Exception as exc:
        raise TranscriptionError(f"Transcription failed: {exc}") from exc
    finally:
        if path:
            Path(path).unlink(missing_ok=True)
