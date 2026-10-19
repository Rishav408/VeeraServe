from collections.abc import Callable

from fastapi.testclient import TestClient

from app.core.config import get_settings

settings = get_settings()


def _priced_items(client: TestClient, count: int = 2) -> list[dict]:
    items = client.get("/api/v1/menu").json()
    return [item for item in items if item["price"] is not None][:count]


def _place(client: TestClient, items: list[dict], headers: dict[str, str] | None = None) -> dict:
    payload = {
        "payment_method": "cash",
        "items": [{"menu_item_id": items[0]["id"], "quantity": 2}],
    }
    return client.post("/api/v1/orders", json=payload, headers=headers).json()


def test_dashboard_requires_admin(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("staff@example.com", role="staff")
    create_user("admin@example.com", role="admin")

    assert client.get("/api/v1/analytics/dashboard").status_code == 401
    assert (
        client.get("/api/v1/analytics/dashboard", headers=auth_headers("diner@example.com")).status_code
        == 403
    )
    assert (
        client.get("/api/v1/analytics/dashboard", headers=auth_headers("staff@example.com")).status_code
        == 403
    )


def test_dashboard_aggregates_orders(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("admin@example.com", role="admin")
    items = _priced_items(client)

    first = _place(client, items, auth_headers("diner@example.com"))
    _place(client, items, auth_headers("diner@example.com"))

    data = client.get(
        "/api/v1/analytics/dashboard", headers=auth_headers("admin@example.com")
    ).json()

    assert data["total_orders"] == 2
    assert data["total_revenue"] == first["total"] * 2
    assert data["avg_order_value"] == first["total"]
    assert data["active_orders"] == 2

    statuses = {entry["status"]: entry["count"] for entry in data["orders_by_status"]}
    assert statuses["pending"] == 2
    assert statuses["served"] == 0

    assert len(data["revenue_by_day"]) == 7
    assert data["revenue_by_day"][-1]["orders"] == 2
    assert data["revenue_by_day"][-1]["revenue"] == first["total"] * 2

    assert len(data["peak_hours"]) == 24
    assert sum(entry["orders"] for entry in data["peak_hours"]) == 2

    assert data["top_items"][0]["menu_item_id"] == items[0]["id"]
    assert data["top_items"][0]["quantity"] == 4
    assert data["top_items"][0]["name"] == items[0]["name"]


def test_dashboard_empty_state(client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]) -> None:
    create_user("admin@example.com", role="admin")

    data = client.get(
        "/api/v1/analytics/dashboard", headers=auth_headers("admin@example.com")
    ).json()

    assert data["total_orders"] == 0
    assert data["total_revenue"] == 0
    assert data["avg_order_value"] == 0
    assert data["top_items"] == []
    assert data["ratings"]["count"] == 0
    assert data["ratings"]["overall"] == 0
    assert data["menu_items"] > 0
