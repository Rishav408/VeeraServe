from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="VeeraServe AI Backend",
    description="Multimodal Chat System Backend for VeeraServe",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1", tags=["Chat"])


@app.get("/")
def read_root():
    return {"status": "ok", "message": "VeeraServe AI Backend running. Docs at /docs"}
