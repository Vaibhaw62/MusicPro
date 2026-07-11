"""
=============================================================
VibeStream Backend LLM Service

Cloudflare Workers AI - Llama 3
Gemini Flash (Prepared as Fallback)

Generates human-like conversational text dynamically.
=============================================================
"""

import logging
import os
import threading
import json
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("LLMService")

# ============================================================
# CONFIG
# ============================================================

ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")

API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ------------------------------------------------------------
# Cloudflare
# ------------------------------------------------------------

MODEL = "@cf/meta/llama-3.1-8b-instruct"

# ------------------------------------------------------------
# Gemini
# ------------------------------------------------------------

GEMINI_MODEL = "gemini-2.0-flash"

REQUEST_TIMEOUT = 15


# ============================================================
# SERVICE
# ============================================================
 
class LLMService:

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

        # ----------------------------------------------------
        # Cloudflare
        # ----------------------------------------------------

        self.cloudflare_url = (
            f"https://api.cloudflare.com/client/v4/"
            f"accounts/{ACCOUNT_ID}/ai/run/{MODEL}"
        )

        self.cloudflare_headers = {

            "Authorization": f"Bearer {API_TOKEN}",

            "Content-Type": "application/json"

        }

        # ----------------------------------------------------
        # Gemini
        # ----------------------------------------------------

        self.gemini_url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        )

        self.gemini_headers = {

            "Content-Type": "application/json"

        }

        logger.info("Cloudflare Provider Ready.")

        if GEMINI_API_KEY:

            logger.info("Gemini Provider Ready.")

        else:

            logger.warning("Gemini API Key not found.")

        self._initialized = True

    # ========================================================
    # GEMINI PROVIDER
    # ========================================================

    def _generate_gemini(
        self,
        username: str,
        time_of_day: str,
    ) -> str:
        """
        Generates a greeting using Google's Gemini.
        This method is ONLY used as a fallback.
        """

        if not GEMINI_API_KEY:
            raise RuntimeError("Gemini API key not configured.")

        logger.info("=" * 70)
        logger.info("Trying Gemini Provider...")

        prompt = (
            "You are Vibe, an enthusiastic and friendly AI music assistant. "
            "Reply with exactly one short conversational sentence. "
            "Do not use emojis. "
            "Do not say 'How can I help you?'. "
            "Ask the user what mood, vibe, artist or genre they want.\n\n"
            f"User Name: {username}\n"
            f"Time Of Day: {time_of_day}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.8,
                "maxOutputTokens": 50,
                "topP": 0.95,
                "topK": 40
            }
        }

        response = requests.post(
            self.gemini_url,
            headers=self.gemini_headers,
            json=payload,
            timeout=REQUEST_TIMEOUT
        )

        logger.info(
            "Gemini Status : %s",
            response.status_code
        )

        response.raise_for_status()

        data = response.json()

        try:

            generated_text = (
                data["candidates"][0]
                    ["content"]["parts"][0]["text"]
            )

        except Exception:

            logger.error(
                "Gemini Invalid Response : %s",
                json.dumps(data, indent=2)
            )

            raise RuntimeError(
                "Gemini returned an invalid response."
            )

        generated_text = (
            generated_text
            .strip()
            .strip('"')
            .strip("'")
        )

        logger.info("Gemini Provider Success.")
        logger.info("=" * 70)

        return generated_text

    # ========================================================
    # PUBLIC
    # ========================================================

    def generate_greeting(self, username: str, time_of_day: str) -> str:
        """
        Generates a dynamic, human-like greeting.

        Priority

        1. Cloudflare
        2. Gemini
        3. Raise RuntimeError
        """

        # ----------------------------------------------------
        # Cloudflare Configuration Check
        # ----------------------------------------------------

        if not ACCOUNT_ID or not API_TOKEN:

            logger.warning(
                "Cloudflare credentials missing."
            )

        else:

            try:

                logger.info("=" * 70)
                logger.info("Trying Cloudflare Provider...")

                # System prompt to force it to act like a DJ/Music Assistant
                system_prompt = (
                    "You are Vibe, an enthusiastic, friendly AI music assistant. "
                    "Keep your answer to exactly one short, conversational sentence. "
                    "Do not use emojis. "
                    "Do not say 'How can I help you?'. "
                    "Ask them what vibe, mood, artist or genre they want to listen to."
                )

                user_prompt = (
                    f"Greet the user '{username}'. "
                    f"It is currently {time_of_day}."
                )

                payload = {

                    "messages": [

                        {
                            "role": "system",
                            "content": system_prompt
                        },

                        {
                            "role": "user",
                            "content": user_prompt
                        }

                    ],

                    "max_tokens": 40

                }

                response = requests.post(

                    self.cloudflare_url,

                    headers=self.cloudflare_headers,

                    json=payload,

                    timeout=REQUEST_TIMEOUT

                )

                logger.info(
                    "Cloudflare Status : %s",
                    response.status_code
                )

                response.raise_for_status()

                data = response.json()

                if data.get("success"):

                    generated_text = (
                        data["result"]["response"]
                        .strip()
                        .strip('"')
                        .strip("'")
                    )

                    logger.info(
                        "Cloudflare Provider Success."
                    )

                    logger.info("=" * 70)

                    return generated_text

                raise RuntimeError(
                    f"Cloudflare returned unsuccessful response : {data}"
                )

            except Exception as cloudflare_error:

                logger.exception(
                    "Cloudflare Provider Failed."
                )

                logger.warning(
                    "Switching to Gemini..."
                )

        # ----------------------------------------------------
        # Gemini Fallback
        # ----------------------------------------------------

        try:

            return self._generate_gemini(

                username=username,

                time_of_day=time_of_day,

            )

        except Exception as gemini_error:

            logger.exception(
                "Gemini Provider Failed."
            )

            logger.error("=" * 70)
            logger.error("ALL LLM PROVIDERS FAILED")
            logger.error(
                "Cloudflare Error : %s",
                str(cloudflare_error)
                if 'cloudflare_error' in locals()
                else "Cloudflare not configured."
            )
            logger.error(
                "Gemini Error : %s",
                str(gemini_error)
            )
            logger.error("=" * 70)

            raise RuntimeError(
                "Both Cloudflare and Gemini providers failed."
            ) from gemini_error

llm_service = LLMService()