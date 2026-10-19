from types import SimpleNamespace

import pytest

from app.llm import vision as vision_module
from app.llm.client import LLMError
from app.llm.vision import describe_image


class FakeCompletions:
    def __init__(self, content: str = "a plate of paneer tikka") -> None:
        self.content = content
        self.calls: list[dict] = []

    def create(self, **kwargs: object) -> SimpleNamespace:
        self.calls.append(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=self.content))])


class FakeClient:
    def __init__(self, completions: object) -> None:
        self.chat = SimpleNamespace(completions=completions)


def test_describe_image_sends_a_data_uri(monkeypatch: pytest.MonkeyPatch) -> None:
    completions = FakeCompletions("paneer tikka")
    monkeypatch.setattr(vision_module, "_get_client", lambda: FakeClient(completions))

    description = describe_image(b"\x00\x01\x02", mime_type="image/png")

    assert description == "paneer tikka"
    (call,) = completions.calls
    user_content = call["messages"][1]["content"]
    image_part = next(part for part in user_content if part["type"] == "image_url")
    assert image_part["image_url"]["url"].startswith("data:image/png;base64,")


def test_describe_image_wraps_runtime_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    class Boom:
        def create(self, **kwargs: object) -> None:
            raise RuntimeError("connection refused")

    monkeypatch.setattr(vision_module, "_get_client", lambda: FakeClient(Boom()))

    with pytest.raises(LLMError):
        describe_image(b"\x00\x01")


def test_describe_image_rejects_empty_payload() -> None:
    with pytest.raises(LLMError):
        describe_image(b"")
