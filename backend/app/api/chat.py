from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.agent.streaming import format_sse, iter_turn_events
from app.api.deps import OptionalUser
from app.core.config import get_settings
from app.db.session import get_db

router = APIRouter()

AUDIO_TYPES = ("audio/",)
IMAGE_TYPES = ("image/",)


def _read_upload(upload: UploadFile, allowed_prefixes: tuple[str, ...]) -> tuple[bytes, str]:
    settings = get_settings()
    content_type = (upload.content_type or "").lower()
    if content_type and not any(content_type.startswith(p) for p in allowed_prefixes):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {content_type}",
        )
    data = upload.file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Upload exceeds {settings.max_upload_mb} MB",
        )
    return data, content_type or "application/octet-stream"


@router.post("/chat")
def chat(
    current_user: OptionalUser,
    db: Session = Depends(get_db),
    text: Annotated[str, Form()] = "",
    session_id: Annotated[str, Form()] = "",
    audio: Annotated[UploadFile | None, File()] = None,
    image: Annotated[UploadFile | None, File()] = None,
) -> StreamingResponse:
    user_id = current_user.id if current_user else None

    audio_bytes: bytes | None = None
    audio_suffix = ".webm"
    if audio is not None and audio.filename:
        audio_bytes, audio_type = _read_upload(audio, AUDIO_TYPES)
        audio_suffix = ".wav" if "wav" in audio_type else ".webm"

    image_bytes: bytes | None = None
    image_mime = "image/jpeg"
    if image is not None and image.filename:
        image_bytes, image_mime = _read_upload(image, IMAGE_TYPES)

    resolved_session = session_id.strip() or uuid4().hex

    def event_stream():
        for event in iter_turn_events(
            db,
            session_id=resolved_session,
            user_id=user_id,
            text=text,
            audio=audio_bytes,
            audio_suffix=audio_suffix,
            image=image_bytes,
            image_mime=image_mime,
        ):
            yield format_sse(event)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
