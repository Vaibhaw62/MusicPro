"""
=============================================================
VibeStream Backend TTS Service

Cloudflare Workers AI - MeloTTS

Responsibilities

✔ Singleton
✔ Thread Safe
✔ Render Compatible
✔ Cloudflare Workers AI
✔ MP3 Generation
✔ Health Check

No frontend logic.
No avatar logic.const speakText = useCallback(async (text, language = "en") => {
    if (!text || !text.trim()) return;

    try {
      // Let the frontend ttsService handle the actual audio playback
      await ttsService.speak(text, language);
    } catch (err) {
      console.error("TTS playback failed:", err);
      setBotState(BOT_STATES.IDLE);
    }
  }, []);
=============================================================
"""

from __future__ import annotations

import base64
import logging
import os
import threading
from dataclasses import dataclass
from typing import Optional

import requests
from dotenv import load_dotenv
load_dotenv()

# ============================================================
# LOGGER
# ============================================================

logger = logging.getLogger("TTSService")


# ============================================================
# CONFIG
# ============================================================

ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")

API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

MODEL = "@cf/deepgram/aura-2-en"

REQUEST_TIMEOUT = 180


# ============================================================
# RESPONSE MODEL
# ============================================================

@dataclass(slots=True)
class TTSResult:

    success: bool

    audio_bytes: bytes

    mime_type: str

    provider: str

    model: str

    message: Optional[str] = None


# ============================================================
# SERVICE
# ============================================================

class TTSService:

    _instance = None

    _lock = threading.Lock()

    def __new__(cls):

        if cls._instance is None:

            with cls._lock:

                if cls._instance is None:

                    cls._instance = super().__new__(cls)

        return cls._instance

    def __init__(self):

        if getattr(self, "_initialized", False):

            return

        self.account_id = ACCOUNT_ID

        self.api_token = API_TOKEN

        self.model = MODEL

        self.url = (
            f"https://api.cloudflare.com/client/v4/"
            f"accounts/{self.account_id}/ai/run/{self.model}"
        )

        self.headers = {

            "Authorization": f"Bearer {self.api_token}",

            "Content-Type": "application/json"

        }

        self._initialized = True

        logger.info(

            "Cloudflare Workers AI TTS initialized."

        )

    # ========================================================
    # HEALTH
    # ========================================================

    def is_ready(self) -> bool:

        return (

            bool(self.account_id)

            and

            bool(self.api_token)

        )

    # ========================================================
    # MODEL INFO
    # ========================================================

    def model_info(self):

        return {

            "provider": "Cloudflare Workers AI",

            "model": self.model,

            "ready": self.is_ready()

        }

    def speak(self, text: str, language: str = "en") -> TTSResult:
        if not self.is_ready():
            raise RuntimeError("Cloudflare credentials missing.")
        raise RuntimeError("Cloudflare quota exceeded - forcing browser fallback.")

        import random
        import time

        payload = {
            "text": text,
            
            }
        print(f"\n[DEBUG] Sending this payload to Cloudflare: {payload}\n")

        max_attempts = 6
        base_delay = 0.5

    # Serialize Cloudflare requests so only one inference runs at a time.
        with self._lock:

            last_error = None

            for attempt in range(1, max_attempts + 1):

                try:

                    logger.info("=" * 70)
                    logger.info(
                        "Cloudflare TTS Attempt %d/%d",
                        attempt,
                        max_attempts,
                    )

                    response = requests.post(
                        self.url,
                        headers=self.headers,
                        json=payload,
                        timeout=30,
                    )

                    logger.info("Status   : %s", response.status_code)
                    logger.info("Response : %s", response.text)

                    # --- NEW ROBUST HANDLING ---
                    if response.status_code == 200:
                        content_type = response.headers.get("Content-Type", "")
                        
                        # Deepgram Aura returns raw audio bytes
                        if "audio" in content_type or response.content.startswith(b'\xff\xf3') or response.content.startswith(b'ID3'):
                            return TTSResult(success=True, audio_bytes=response.content, mime_type="audio/mpeg", provider="Cloudflare", model=self.model)
                        
                        # Other models return JSON
                        data = response.json()
                        if data.get("success"):
                            result = data.get("result", {})
                            audio_b64 = result.get("audio") or result.get("audio_base64")
                            if audio_b64:
                                return TTSResult(success=True, audio_bytes=base64.b64decode(audio_b64), mime_type="audio/mpeg", provider="Cloudflare", model=self.model)
                        raise RuntimeError(f"Unexpected JSON format: {data}")

                    # Retry Logic for errors
                    if response.status_code in (429, 500, 502, 503, 504):
                        last_error = RuntimeError(f"HTTP {response.status_code}: {response.text}")
                        if attempt < max_attempts:
                            time.sleep(base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.3))
                            continue
                    
                    response.raise_for_status()

                except (requests.exceptions.RequestException, Exception) as exc:
                    last_error = exc
                    if attempt < max_attempts:
                        time.sleep(base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.3))
                        continue
                    break

            logger.error("=" * 70)
            logger.error(
                "Cloudflare TTS failed after %d attempts.",
                max_attempts,
            )
            logger.error("Last Error: %s", last_error)
            logger.error("=" * 70)

            raise RuntimeError(f"TTS Failed after {max_attempts} attempts: {last_error}")
   
tts_service = TTSService()