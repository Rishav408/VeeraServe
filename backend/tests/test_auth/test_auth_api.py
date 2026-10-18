from fastapi.testclient import TestClient

CREDENTIALS = {"name": "Asha", "email": "Asha@Example.com", "password": "secret123"}


def test_register_then_login_and_read_me(client: TestClient) -> None:
    register = client.post("/api/v1/auth/register", json=CREDENTIALS)
    assert register.status_code == 201, register.text
    body = register.json()
    assert body["user"]["email"] == "asha@example.com"
    assert body["user"]["role"] == "user"
    assert body["token_type"] == "bearer"

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "asha@example.com", "password": "secret123"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "asha@example.com"


def test_register_rejects_duplicate_email(client: TestClient) -> None:
    assert client.post("/api/v1/auth/register", json=CREDENTIALS).status_code == 201
    duplicate = client.post(
        "/api/v1/auth/register",
        json={**CREDENTIALS, "email": "asha@example.com"},
    )
    assert duplicate.status_code == 409


def test_login_rejects_bad_credentials(client: TestClient) -> None:
    client.post("/api/v1/auth/register", json=CREDENTIALS)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "asha@example.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_protected_route_requires_valid_token(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 401
    assert (
        client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"}).status_code
        == 401
    )
