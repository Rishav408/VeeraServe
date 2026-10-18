from collections.abc import Callable, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.core.security import hash_password
from app.db.base import Base
from app.db.seed import seed_menu
from app.db.session import get_db
from app.main import app
from app.models import User

DEFAULT_PASSWORD = "secret123"


@pytest.fixture()
def session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )
    with factory() as session:
        seed_menu(session)
    return factory


@pytest.fixture()
def db(session_factory: sessionmaker[Session]) -> Generator[Session, None, None]:
    with session_factory() as session:
        yield session


@pytest.fixture()
def client(session_factory: sessionmaker[Session]) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def create_user(
    session_factory: sessionmaker[Session],
) -> Callable[..., int]:
    def _create(email: str, role: str = "user", password: str = DEFAULT_PASSWORD) -> int:
        with session_factory() as session:
            user = User(
                name=email.split("@")[0] or "user",
                email=email,
                password_hash=hash_password(password),
                role=role,
            )
            session.add(user)
            session.commit()
            return user.id

    return _create


@pytest.fixture()
def auth_headers(client: TestClient) -> Callable[..., dict[str, str]]:
    def _headers(email: str, password: str = DEFAULT_PASSWORD) -> dict[str, str]:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _headers
