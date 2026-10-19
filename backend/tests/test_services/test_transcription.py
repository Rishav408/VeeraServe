import pytest

from app.services import transcription as transcription_module
from app.services.transcription import TranscriptionError, transcribe_audio


class FakeSegment:
    def __init__(self, text: str) -> None:
        self.text = text


class FakeModel:
    def __init__(self, segments: list[FakeSegment]) -> None:
        self._segments = segments

    def transcribe(self, path: str) -> tuple[list[FakeSegment], object]:
        return self._segments, None


def test_transcribe_audio_joins_segments(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        transcription_module,
        "_get_model",
        lambda: FakeModel([FakeSegment(" two "), FakeSegment("chai")]),
    )

    assert transcribe_audio(b"audio", suffix=".wav") == "two chai"


def test_transcribe_audio_wraps_missing_model(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom() -> object:
        raise RuntimeError("model not downloaded")

    monkeypatch.setattr(transcription_module, "_get_model", boom)

    with pytest.raises(TranscriptionError):
        transcribe_audio(b"audio")


def test_transcribe_audio_rejects_empty_payload() -> None:
    with pytest.raises(TranscriptionError):
        transcribe_audio(b"")
