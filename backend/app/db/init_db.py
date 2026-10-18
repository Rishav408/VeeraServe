from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    import app.models  # noqa: F401  (ensures every model is registered on Base.metadata)

    Base.metadata.create_all(bind=engine)
