import os
import shutil
import uuid
from fastapi import UploadFile

# Temp storage for processing audio and image
TMP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tmp")
os.makedirs(TMP_DIR, exist_ok=True)

def save_upload_file_tmp(upload_file: UploadFile) -> str:
    """Saves an UploadFile to a temporary file on disk and returns the file path."""
    if not upload_file:
        return None
        
    try:
        # Default suffix if none exists
        filename = upload_file.filename or "file.bin"
        suffix = os.path.splitext(filename)[1]
        temp_file_name = f"{uuid.uuid4().hex}{suffix}"
        temp_file_path = os.path.join(TMP_DIR, temp_file_name)
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return temp_file_path
    finally:
        upload_file.file.close()

def delete_tmp_file(file_path: str):
    """Deletes a temporary file from disk."""
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error removing temporary file {file_path}: {e}")
