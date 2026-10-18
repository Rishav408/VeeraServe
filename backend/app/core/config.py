from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"

    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    database_url: str = "sqlite:///./veeraserve.db"
    menu_seed_path: str = "../data/menu.seed.json"

    gst_rate: float = 0.05
    payment_methods: Annotated[list[str], NoDecode] = ["cash", "upi", "card"]

    jwt_secret: str = "change-me-in-your-env-min-32-bytes-long"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440

    llm_base_url: str = "http://localhost:1234/v1"
    llm_model: str = "qwen2.5-vl-3b-instruct"
    llm_api_key: str = "lm-studio"
    embedding_model: str = "nomic-embed-text"

    max_upload_mb: int = 10
    allowed_upload_types: Annotated[list[str], NoDecode] = ["audio/*", "image/*"]

    @field_validator("cors_origins", "allowed_upload_types", "payment_methods", mode="before")
    @classmethod
    def _split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
