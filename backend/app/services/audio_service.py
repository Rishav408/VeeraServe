from faster_whisper import WhisperModel

# Initialize Whisper model.
# 'base' model provides a good tradeoff between speed and accuracy.
model_size = "base"
# On supported hardware you might switch device="cuda" and compute_type="float16"
whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")

def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribes audio file using faster-whisper.
    Returns transcribed text.
    """
    try:
        segments, info = whisper_model.transcribe(audio_file_path, beam_size=5)
        text = " ".join(segment.text for segment in segments)
        return text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""
