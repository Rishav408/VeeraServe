from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.feedback import router as feedback_router
from app.api.health import router as health_router
from app.api.menu import router as menu_router
from app.api.orders import router as orders_router
from app.api.reservations import router as reservations_router
from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.seed import seed_menu
from app.db.session import SessionLocal
from app.rag.ingest import reindex_menu

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        seed_menu(db)
        try:
            reindex_menu(db)
        except Exception as exc:
            logger.warning("Menu index unavailable (LM Studio not running?): %s", exc)
    yield


app = FastAPI(
    title="VeeraServe AI Backend",
    description="VeeraServe backend API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(menu_router, prefix="/api/v1", tags=["Menu"])
app.include_router(auth_router, prefix="/api/v1", tags=["Auth"])
app.include_router(orders_router, prefix="/api/v1", tags=["Orders"])
app.include_router(feedback_router, prefix="/api/v1", tags=["Feedback"])
app.include_router(reservations_router, prefix="/api/v1", tags=["Reservations"])
app.include_router(chat_router, prefix="/api/v1", tags=["Chat"])


@app.get("/")
def read_root():
    return {"status": "ok", "message": "VeeraServe AI Backend running. Docs at /docs"}
