from fastapi.testclient import TestClient


def test_list_categories(client: TestClient) -> None:
    response = client.get("/api/v1/categories")

    assert response.status_code == 200
    categories = response.json()
    assert categories
    assert {"id", "label", "sort_order"} <= set(categories[0])
    assert [category["sort_order"] for category in categories] == sorted(
        category["sort_order"] for category in categories
    )


def test_list_menu_happy_path(client: TestClient) -> None:
    response = client.get("/api/v1/menu")

    assert response.status_code == 200
    items = response.json()
    assert items
    assert {"id", "name", "category_id", "price", "is_veg"} <= set(items[0])


def test_list_menu_filters(client: TestClient) -> None:
    veg_items = client.get("/api/v1/menu", params={"veg": "true"}).json()
    assert veg_items and all(item["is_veg"] for item in veg_items)

    affordable = client.get("/api/v1/menu", params={"max_price": 100}).json()
    assert all(item["price"] is not None and item["price"] <= 100 for item in affordable)

    searched = client.get("/api/v1/menu", params={"search": "mac"}).json()
    assert searched
    assert all(
        "mac" in (item["name"] + " " + (item["description"] or "")).lower()
        for item in searched
    )

    category = client.get("/api/v1/categories").json()[0]["id"]
    by_category = client.get("/api/v1/menu", params={"category": category}).json()
    assert all(item["category_id"] == category for item in by_category)


def test_get_menu_item(client: TestClient) -> None:
    items = client.get("/api/v1/menu").json()
    response = client.get(f"/api/v1/menu/{items[0]['id']}")

    assert response.status_code == 200
    assert response.json() == items[0]


def test_get_menu_item_unknown_id_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/menu/does-not-exist")

    assert response.status_code == 404
