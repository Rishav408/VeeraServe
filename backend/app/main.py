from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.menu import router as menu_router
from app.api.orders import router as orders_router
from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.seed import seed_menu
from app.db.session import SessionLocal

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        seed_menu(db)
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


@app.get("/")
def read_root():
    return {"status": "ok", "message": "VeeraServe AI Backend running. Docs at /docs"}
