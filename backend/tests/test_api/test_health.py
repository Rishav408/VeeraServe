from fastapi.testclient import TestClient

from app.api import health as health_module
from app.llm.health import LLMStatus
from app.main import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_llm_reports_unavailable_state(monkeypatch) -> None:
    monkeypatch.setattr(
        health_module,
        "probe_llm",
        lambda: LLMStatus(available=False, detail="LM Studio is not running"),
    )

    response = client.get("/api/v1/health/llm")

    assert response.status_code == 200
    assert response.json() == {
        "available": False,
        "model_id": None,
        "context_length": None,
        "detail": "LM Studio is not running",
    }
