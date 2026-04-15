from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from typing import Optional
import time

from services.audio_service import transcribe_audio
from services.ai_service import process_chat
from utils.file_handler import save_upload_file_tmp, delete_tmp_file

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(
    session_id: str = Form("default_session"),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None)
):
    start_time = time.time()
    
    if not text and not image and not audio:
        raise HTTPException(status_code=400, detail="Must provide text, image, or audio input")

    tmp_image_path = None
    tmp_audio_path = None
    
    try:
        # Process Audio if present
        if audio:
            tmp_audio_path = save_upload_file_tmp(audio)
            transcribed_text = transcribe_audio(tmp_audio_path)
            # Combine audio text with any provided text
            if transcribed_text:
                text = f"{text}\nAudio: {transcribed_text}" if text else transcribed_text

        # Use fallback if text is still None
        combined_text = text if text else ""

        # Process Image if present
        if image:
            tmp_image_path = save_upload_file_tmp(image)
            
        # Call AI Service
        bot_response = process_chat(
            session_id=session_id, 
            text=combined_text, 
            image_path=tmp_image_path
        )
        
        processing_time = round(time.time() - start_time, 2)
        
        return {
            "response": bot_response,
            "metadata": {
                "processing_time_sec": processing_time,
                "input_types": {
                    "text": bool(text),
                    "audio": bool(audio),
                    "image": bool(image)
                }
            }
        }
        
    finally:
        # Clean up tmp files
        if tmp_audio_path:
            delete_tmp_file(tmp_audio_path)
        if tmp_image_path:
            delete_tmp_file(tmp_image_path)
