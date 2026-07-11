"""
=============================================================
VibeStream TTS Router

Responsibilities

✔ Health Check

✔ Receive Text

✔ Call TTS Service

✔ Return Audio Stream

No chatbot logic.
No semantic search.
No recommendation logic.
=============================================================
"""

import logging
import time
import uuid

from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ml.tt_voice.tts_service import tts_service


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(

    prefix="/tts",

    tags=["Text To Speech"]

)


# ============================================================
# LOGGER
# ============================================================

logger = logging.getLogger("TTSRouter")


# ============================================================
# REQUEST MODEL
# ============================================================

class TTSRequest(BaseModel):

    text: str = Field(

        min_length=1,

        max_length=4000

    )

    language: str = "en"


# ============================================================
# HEALTH
# ============================================================

@router.get(

    "/health"

)

async def health_check():

    return {

        "success": True,

        "service": "tts",

        "ready": tts_service.is_ready(),

        "model": tts_service.model_info()

    }


# ============================================================
# SPEAK
# ============================================================

@router.get(

    "/speak"

)

async def speak_info():

    return {

        "success": True,

        "message": "Use POST /tts/speak with JSON: {\"text\":\"Hello\",\"language\":\"en\"}. Open /tts/health to check service status.",

        "method": "POST",

        "content_type": "application/json"

    }


@router.post(

    "/speak"

)

async def speak(

    payload: TTSRequest

):

    request_id = str(

        uuid.uuid4()

    )

    start_time = time.perf_counter()

    logger.info("=" * 70)

    logger.info(

        "TTS request received."

    )

    logger.info(

        "Request ID : %s",

        request_id

    )

    logger.info(

        "Language : %s",

        payload.language

    )

    logger.info(

        "Characters : %d",

        len(payload.text)

    )

    try:

        result = tts_service.speak(

            text=payload.text,

            language=payload.language

        )

        elapsed = round(

            time.perf_counter() - start_time,

            3

        )

        logger.info(

            "TTS completed in %.3f sec",

            elapsed

        )

        headers = {

            "X-TTS-Provider": result.provider,

            "X-TTS-Model": result.model,

            "X-TTS-Request-ID": request_id,

            "X-TTS-Processing-Time": str(elapsed),

            "Cache-Control": "no-store"

        }

        return Response(

            content=result.audio_bytes,

            media_type=result.mime_type,

            headers=headers

        )

    except HTTPException:

        raise

    except Exception as exc:

        logger.exception(

            "TTS generation failed."

        )

        raise HTTPException(

            status_code=500,

            detail={

                "success": False,

                "message": str(exc),

                "request_id": request_id

            }

        )


    
