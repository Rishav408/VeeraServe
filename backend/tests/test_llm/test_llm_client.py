from types import SimpleNamespace

import pytest

from app.llm import client as client_module
from app.llm.client import LLMError, chat_completion


class FakeCompletions:
    def __init__(self, content: str = "Namaste!") -> None:
        self.content = content
        self.calls: list[dict] = []

    def create(self, **kwargs: object) -> SimpleNamespace:
        self.calls.append(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=self.content))])


class FakeClient:
    def __init__(self, completions: object) -> None:
        self.chat = SimpleNamespace(completions=completions)


def test_chat_completion_returns_model_text(monkeypatch: pytest.MonkeyPatch) -> None:
    completions = FakeCompletions("Namaste, welcome to Veeradhar Dhaba!")
    monkeypatch.setattr(client_module, "_get_client", lambda: FakeClient(completions))

    reply = chat_completion(
        "hello",
        system_prompt="You are Veera",
        model="test-model",
        temperature=0.2,
    )

    assert reply == "Namaste, welcome to Veeradhar Dhaba!"
    (call,) = completions.calls
    assert call["model"] == "test-model"
    assert call["temperature"] == 0.2
    assert call["messages"] == [
        {"role": "system", "content": "You are Veera"},
        {"role": "user", "content": "hello"},
    ]


def test_chat_completion_wraps_runtime_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    class Boom:
        def create(self, **kwargs: object) -> None:
            raise RuntimeError("connection refused")

    monkeypatch.setattr(client_module, "_get_client", lambda: FakeClient(Boom()))

    with pytest.raises(LLMError):
        chat_completion("hello")
