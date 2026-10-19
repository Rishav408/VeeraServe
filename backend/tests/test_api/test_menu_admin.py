from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.api import menu as menu_api
from app.models import Category, MenuItem

AuthHeaders = Callable[..., dict[str, str]]


@pytest.fixture(autouse=True)
def _no_reindex(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    calls: list[int] = []
    monkeypatch.setattr(menu_api, "reindex_menu", lambda db: calls.append(1) or 0)
    return calls


def _category_id(client: TestClient) -> str:
    return client.get("/api/v1/categories").json()[0]["id"]


def _payload(client: TestClient, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Admin Special Thali",
        "category_id": _category_id(client),
        "price": 199,
        "happy_hour_price": 149,
        "is_veg": True,
        "spice_level": 2,
        "tags": ["thali", "special"],
        "description": "Chef's platter",
    }
    payload.update(overrides)
    return payload


def test_admin_can_create_item(client: TestClient, create_user, auth_headers: AuthHeaders) -> None:
    create_user("admin@veera.dev", role="admin")
    headers = auth_headers("admin@veera.dev")

    response = client.post("/api/v1/menu", json=_payload(client), headers=headers)

    assert response.status_code == 201
    created = response.json()
    assert created["id"] == "admin-special-thali"
    assert created["price"] == 199
    assert created["happy_hour_price"] == 149

    listed = client.get("/api/v1/menu", params={"search": "Admin Special"}).json()
    assert [item["id"] for item in listed] == [created["id"]]


def test_create_item_triggers_reindex(
    client: TestClient, create_user, auth_headers: AuthHeaders, _no_reindex: list[int]
) -> None:
    create_user("admin@veera.dev", role="admin")
    client.post("/api/v1/menu", json=_payload(client), headers=auth_headers("admin@veera.dev"))

    assert _no_reindex


def test_create_item_unknown_category_returns_400(
    client: TestClient, create_user, auth_headers: AuthHeaders
) -> None:
    create_user("admin@veera.dev", role="admin")

    response = client.post(
        "/api/v1/menu",
        json=_payload(client, category_id="does-not-exist"),
        headers=auth_headers("admin@veera.dev"),
    )

    assert response.status_code == 400


def test_non_admin_cannot_mutate_menu(
    client: TestClient, create_user, auth_headers: AuthHeaders
) -> None:
    create_user("staff@veera.dev", role="staff")
    headers = auth_headers("staff@veera.dev")

    assert client.post("/api/v1/menu", json=_payload(client), headers=headers).status_code == 403
    assert client.patch("/api/v1/menu/anything", json={"price": 1}, headers=headers).status_code == 403
    assert client.delete("/api/v1/menu/anything", headers=headers).status_code == 403


def test_unauthenticated_write_returns_401(client: TestClient) -> None:
    response = client.post("/api/v1/menu", json=_payload(client))

    assert response.status_code == 401


def test_admin_can_update_price_and_availability(
    client: TestClient, create_user, auth_headers: AuthHeaders
) -> None:
    create_user("admin@veera.dev", role="admin")
    headers = auth_headers("admin@veera.dev")
    item_id = client.get("/api/v1/menu").json()[0]["id"]

    response = client.patch(
        f"/api/v1/menu/{item_id}",
        json={"price": 42, "is_available": False},
        headers=headers,
    )

    assert response.status_code == 200
    updated = response.json()
    assert updated["price"] == 42
    assert updated["is_available"] is False

    assert client.get(f"/api/v1/menu/{item_id}").json()["price"] == 42


def test_admin_can_delete_item(client: TestClient, create_user, auth_headers: AuthHeaders) -> None:
    create_user("admin@veera.dev", role="admin")
    headers = auth_headers("admin@veera.dev")
    item_id = client.get("/api/v1/menu").json()[0]["id"]

    assert client.delete(f"/api/v1/menu/{item_id}", headers=headers).status_code == 204
    assert client.get(f"/api/v1/menu/{item_id}").status_code == 404


def test_update_unknown_item_returns_404(
    client: TestClient, create_user, auth_headers: AuthHeaders
) -> None:
    create_user("admin@veera.dev", role="admin")

    response = client.patch(
        "/api/v1/menu/missing", json={"price": 10}, headers=auth_headers("admin@veera.dev")
    )

    assert response.status_code == 404


def test_admin_can_create_category(
    client: TestClient, create_user, auth_headers: AuthHeaders, session_factory: sessionmaker
) -> None:
    create_user("admin@veera.dev", role="admin")

    response = client.post(
        "/api/v1/categories",
        json={"label": "Desserts", "sort_order": 9},
        headers=auth_headers("admin@veera.dev"),
    )

    assert response.status_code == 201
    assert response.json() == {"id": "desserts", "label": "Desserts", "sort_order": 9}
    with session_factory() as session:
        assert session.get(Category, "desserts") is not None


def test_admin_can_move_item_to_new_category(
    client: TestClient, create_user, auth_headers: AuthHeaders, session_factory: sessionmaker
) -> None:
    create_user("admin@veera.dev", role="admin")
    headers = auth_headers("admin@veera.dev")
    item_id = client.get("/api/v1/menu").json()[0]["id"]

    client.post("/api/v1/categories", json={"label": "Specials", "sort_order": 99}, headers=headers)
    new_category = client.get("/api/v1/categories").json()[-1]["id"]

    response = client.patch(
        f"/api/v1/menu/{item_id}", json={"category_id": new_category}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["category_id"] == new_category
    with session_factory() as session:
        assert session.get(MenuItem, item_id).category_id == new_category
