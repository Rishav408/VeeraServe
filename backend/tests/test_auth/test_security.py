from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hashing_roundtrip() -> None:
    hashed = hash_password("secret123")

    assert hashed != "secret123"
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong-password", hashed)


def test_access_token_roundtrip() -> None:
    token = create_access_token(subject="42", role="admin")
    payload = decode_access_token(token)

    assert payload["sub"] == "42"
    assert payload["role"] == "admin"
