"""
=============================================================
Voice Router

Responsibilities

✔ Receive uploaded audio
✔ Save temporary file
✔ Call WhisperService
✔ Parse Voice Command
✔ Delete temporary file
✔ Return JSON

No recommendation logic belongs here.
=============================================================
"""

import logging
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path

from fastapi import APIRouter
from fastapi import File
from fastapi import HTTPException
from fastapi import UploadFile

from ml.voice_ai.whisper_service import whisper_service
from ml.voice_ai.command_parser import voice_command_parser


# =============================================================
# ROUTER
# =============================================================

router = APIRouter(

    prefix="/voice",

    tags=["Voice"]

)


# =============================================================
# LOGGER
# =============================================================

logger = logging.getLogger("VoiceRouter")


# =============================================================
# SUPPORTED MIME TYPES
# =============================================================

SUPPORTED_AUDIO_TYPES = {

    "audio/webm",

    "audio/wav",

    "audio/x-wav",

    "audio/mpeg",

    "audio/mp3",

    "audio/mp4",

    "audio/x-m4a",

    "audio/aac",

    "audio/ogg",

}


# =============================================================
# HEALTH CHECK
# =============================================================

@router.get(

    "/health"

)
async def health_check():

    """
    Whisper health endpoint.
    """

    return {

        "success": True,

        "service": "voice",

        "ready": whisper_service.is_ready(),

        "model": whisper_service.model_info()

    }


# =============================================================
# TRANSCRIBE
# =============================================================

@router.post(

    "/transcribe"

)
async def transcribe_audio(

    audio: UploadFile = File(...),

    language: str | None = None

):

    """
    Upload audio

    ↓

    Whisper

    ↓

    Voice Command Parser

    ↓

    JSON Response
    """

    content_type = (

        audio.content_type or ""

    ).split(";")[0].strip()

    logger.info(

        "Incoming Content-Type: %s",

        audio.content_type

    )

    # =========================================================
    # MIME VALIDATION
    # =========================================================

    if content_type not in SUPPORTED_AUDIO_TYPES:

        raise HTTPException(

            status_code=400,

            detail=f"Unsupported audio type: {audio.content_type}"

        )

    # =========================================================
    # SIZE VALIDATION
    # =========================================================

    if audio.size is not None:

        if audio.size == 0:

            raise HTTPException(

                status_code=400,

                detail="Empty audio file."

            )

        if audio.size > 30 * 1024 * 1024:

            raise HTTPException(

                status_code=413,

                detail="Audio exceeds 30 MB."

            )

    suffix = (

        Path(

            audio.filename or "voice.webm"

        ).suffix

        or

        ".webm"

    )

    temp_file = None

    try:

        start_time = time.perf_counter()

        request_id = str(

            uuid.uuid4()

        )

        logger.info("=" * 70)

        logger.info("Voice transcription request received.")

        logger.info(

            "Filename: %s",

            audio.filename

        )

        logger.info(

            "Content-Type: %s",

            audio.content_type

        )

        with tempfile.NamedTemporaryFile(

            delete=False,

            suffix=suffix

        ) as tmp:

            temp_file = tmp.name

            shutil.copyfileobj(

                audio.file,

                tmp

            )

        # =====================================================
        # WHISPER
        # =====================================================

        result = whisper_service.transcribe(

            temp_file,

            language=language

        )

        # =====================================================
        # TRANSCRIPT
        # =====================================================

        transcript = (

            result.get("normalized_text")

            or

            result.get("text")

            or

            ""

        )

        # =====================================================
        # VOICE COMMAND PARSER
        # =====================================================

        parsed = voice_command_parser.parse(

            transcript

        )

        # =====================================================
        # TIMING
        # =====================================================

        elapsed = round(

            time.perf_counter() - start_time,

            3

        )

        result["router_processing_time"] = elapsed

        result["original_filename"] = audio.filename

        result["content_type"] = audio.content_type

        logger.info(

            "Voice Request Completed | %.3f sec",

            elapsed

        )

        # =====================================================
        # RESPONSE
        # =====================================================

        return {

            "success": True,

            "voice": result,

            "command": {

                "intent": (

                    parsed.intent.value

                    if parsed.intent

                    else None

                ),

                "playback_action": (

                    parsed.playback_action.value

                    if parsed.playback_action

                    else None

                ),

                "artist": parsed.artist,

                "song": parsed.song,

                "album": parsed.album,

                "playlist": parsed.playlist,

                "genre": parsed.genre,

                "mood": parsed.mood,

                "language": parsed.language,

                "entities": parsed.entities,

                "optimized_query": parsed.optimized_query,

                "confidence": parsed.confidence

            },

            "metadata": {

                "filename": audio.filename,

                "content_type": audio.content_type,

                "processing_time": elapsed,

                "request_id": request_id

            }

        }

    except HTTPException:

        raise

    except Exception as exc:

        logger.exception(

            "Voice transcription failed."

        )

        raise HTTPException(

            status_code=500,

            detail=str(exc)

        )

    finally:

        if (

            temp_file

            and

            os.path.exists(temp_file)

        ):

            try:

                os.remove(

                    temp_file

                )

            except Exception as cleanup_error:

                logger.warning(

                    "Failed removing temporary file: %s",

                    cleanup_error

                )        