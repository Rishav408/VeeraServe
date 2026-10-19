from types import SimpleNamespace

import pytest

from app.llm import health as health_module
from app.llm.health import probe_llm


class FakeModels:
    def __init__(self, ids: list[str] | None = None, error: Exception | None = None) -> None:
        self.ids = ids or []
        self.error = error

    def list(self) -> SimpleNamespace:
        if self.error is not None:
            raise self.error
        return SimpleNamespace(data=[SimpleNamespace(id=model_id) for model_id in self.ids])


class FakeClient:
    def __init__(self, models: FakeModels) -> None:
        self.models = models


def _raise_native() -> dict:
    raise RuntimeError("native endpoint unavailable")


def _patch(
    monkeypatch: pytest.MonkeyPatch,
    *,
    ids: list[str] | None = None,
    error: Exception | None = None,
    native: dict | None = None,
) -> None:
    monkeypatch.setattr(health_module, "_get_client", lambda: FakeClient(FakeModels(ids, error)))
    monkeypatch.setattr(
        health_module,
        "_fetch_native_models",
        (lambda: native) if native is not None else _raise_native,
    )


def test_probe_reports_loaded_model_and_context(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(
        monkeypatch,
        ids=["qwen2.5-vl-3b-instruct", "nomic-embed-text"],
        native={"data": [{"id": "qwen2.5-vl-3b-instruct", "max_context_length": 32768}]},
    )

    status = probe_llm()

    assert status.available is True
    assert status.model_id == "qwen2.5-vl-3b-instruct"
    assert status.context_length == 32768


def test_probe_falls_back_to_configured_context(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, ids=["some-model"])

    status = probe_llm()

    assert status.available is True
    assert status.model_id == "some-model"
    assert status.context_length is not None


def test_probe_degrades_when_server_is_down(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, error=RuntimeError("connection refused"))

    status = probe_llm()

    assert status.available is False
    assert status.detail is not None


def test_probe_degrades_when_no_model_is_loaded(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, ids=[])

    status = probe_llm()

    assert status.available is False
    assert status.model_id is None
