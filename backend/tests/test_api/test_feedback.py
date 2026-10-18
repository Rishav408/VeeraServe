from collections.abc import Callable

from fastapi.testclient import TestClient


def test_feedback_rating_bounds(client: TestClient) -> None:
    valid = client.post(
        "/api/v1/feedback",
        json={"food_rating": 5, "service_rating": 1, "ai_rating": 3, "comment": "nice"},
    )
    assert valid.status_code == 201, valid.text

    for bad_rating in (0, 6, 15):
        invalid = client.post(
            "/api/v1/feedback",
            json={"food_rating": bad_rating, "service_rating": 3, "ai_rating": 3},
        )
        assert invalid.status_code == 422


def test_feedback_listing_is_admin_only(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("admin@example.com", role="admin")
    client.post(
        "/api/v1/feedback",
        json={"food_rating": 4, "service_rating": 4, "ai_rating": 4},
    )

    assert client.get("/api/v1/feedback").status_code == 401
    assert client.get("/api/v1/feedback", headers=auth_headers("diner@example.com")).status_code == 403

    admin_list = client.get("/api/v1/feedback", headers=auth_headers("admin@example.com"))
    assert admin_list.status_code == 200
    assert len(admin_list.json()) == 1


def test_reservation_party_size_and_listing(
    client: TestClient, create_user: Callable[..., int], auth_headers: Callable[..., dict[str, str]]
) -> None:
    create_user("diner@example.com")
    create_user("staff@example.com", role="staff")

    created = client.post(
        "/api/v1/reservations",
        headers=auth_headers("diner@example.com"),
        json={"name": "Asha", "party_size": 4, "time": "2026-11-01T19:30:00Z"},
    )
    assert created.status_code == 201
    assert created.json()["party_size"] == 4

    too_small = client.post(
        "/api/v1/reservations",
        json={"name": "Asha", "party_size": 0, "time": "2026-11-01T19:30:00Z"},
    )
    assert too_small.status_code == 422

    assert client.get("/api/v1/reservations").status_code == 401
    staff_list = client.get("/api/v1/reservations", headers=auth_headers("staff@example.com")).json()
    assert len(staff_list) == 1
