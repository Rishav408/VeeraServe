from dataclasses import asdict
from typing import Any

from fastapi import APIRouter

from app.llm.health import probe_llm

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/llm")
def health_llm() -> dict[str, Any]:
    return asdict(probe_llm())
