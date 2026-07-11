from ml.voice_ai.whisper_service import whisper_service

result = whisper_service.transcribe(
    "sample.m4a"
)
print(

    whisper_service.is_ready()

)
print(result)