from collections.abc import Callable

from fastapi.testclient import TestClient

from app.core.config import get_settings

settings = get_settings()


def _priced_items(client: TestClient, count: int = 2) -> list[dict]:
    items = client.get("/api/v1/menu").json()
    return [item for item in items if item["price"] is not None][:count]


def _place(client: TestClient, items: list[dict], headers: dict[str, str] | None = None) -> dict:
    payload = {
        "table_number": 5,
        "payment_method": "upi",
        "instructions": "less spicy",
        "items": [{"menu_item_id": items[0]["id"], "quantity": 2}],
    }
    return client.post("/api/v1/orders", json=payload, headers=headers)


def test_place_order_computes_totals_server_side(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    headers = auth_headers("diner@example.com")
    items = _priced_items(client)
    expected_subtotal = items[0]["price"] * 2

    response = _place(client, items, headers)
    assert response.status_code == 201, response.text
    order = response.json()

    assert order["subtotal"] == expected_subtotal
    assert order["gst"] == round(expected_subtotal * settings.gst_rate)
    assert order["total"] == order["subtotal"] + order["gst"]
    assert order["status"] == "pending"
    assert order["user_id"] is not None


def test_place_order_allows_guests(client: TestClient) -> None:
    response = _place(client, _priced_items(client))
    assert response.status_code == 201
    assert response.json()["user_id"] is None


def test_place_order_rejects_unsupported_payment(client: TestClient) -> None:
    items = _priced_items(client)
    response = client.post(
        "/api/v1/orders",
        json={"payment_method": "crypto", "items": [{"menu_item_id": items[0]["id"], "quantity": 1}]},
    )
    assert response.status_code == 400


def test_place_order_rejects_unknown_item(client: TestClient) -> None:
    response = client.post(
        "/api/v1/orders",
        json={"payment_method": "cash", "items": [{"menu_item_id": "nope", "quantity": 1}]},
    )
    assert response.status_code == 400


def test_list_orders_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/orders").status_code == 401


def test_list_orders_is_scoped_by_role(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("staff@example.com", role="staff")
    items = _priced_items(client)

    _place(client, items, auth_headers("diner@example.com"))

    diner_orders = client.get("/api/v1/orders", headers=auth_headers("diner@example.com")).json()
    assert len(diner_orders) == 1

    staff_orders = client.get("/api/v1/orders", headers=auth_headers("staff@example.com")).json()
    assert len(staff_orders) == 1


def test_order_detail_enforces_ownership(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("other@example.com")
    order = _place(client, _priced_items(client), auth_headers("diner@example.com")).json()

    own = client.get(f"/api/v1/orders/{order['id']}", headers=auth_headers("diner@example.com"))
    assert own.status_code == 200

    other = client.get(f"/api/v1/orders/{order['id']}", headers=auth_headers("other@example.com"))
    assert other.status_code == 403

    missing = client.get("/api/v1/orders/999999", headers=auth_headers("diner@example.com"))
    assert missing.status_code == 404


def test_status_change_requires_staff_and_follows_forward_transitions(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("staff@example.com", role="staff")
    order = _place(client, _priced_items(client), auth_headers("diner@example.com")).json()

    as_diner = client.patch(
        f"/api/v1/orders/{order['id']}/status",
        headers=auth_headers("diner@example.com"),
        json={"status": "preparing"},
    )
    assert as_diner.status_code == 403

    staff_headers = auth_headers("staff@example.com")
    advanced = client.patch(
        f"/api/v1/orders/{order['id']}/status",
        headers=staff_headers,
        json={"status": "preparing"},
    )
    assert advanced.status_code == 200
    assert advanced.json()["status"] == "preparing"

    skipped = client.patch(
        f"/api/v1/orders/{order['id']}/status",
        headers=staff_headers,
        json={"status": "served"},
    )
    assert skipped.status_code == 400
