"""
==============================================================
VibeStream Whisper Service
--------------------------------------------------------------
Production-grade Faster-Whisper singleton.

Features
--------
✔ Singleton model loading
✔ Automatic CUDA detection
✔ CUDA verification
✔ CPU fallback
✔ Render compatible
✔ Thread safe
✔ Multilingual ready
==============================================================
"""

import logging
import os,time
import threading,contextlib
from pathlib import Path
from typing import Optional
import torch
from dotenv import load_dotenv

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()

# ==========================================================
# LOGGER
# ==========================================================

logger = logging.getLogger("WhisperService")

# ==========================================================
# CONFIGURATION
# ==========================================================

DEFAULT_MODEL = os.getenv(
    "WHISPER_MODEL",
    "small"
)
SUPPORTED_AUDIO_FORMATS = {
    ".wav",
    ".mp3",
    ".m4a",
    ".webm",
    ".ogg",
    ".aac",
    ".flac"
}
SUPPORTED_MODELS = {
    "tiny",
    "base",
    "small",
    "medium",
    "large-v3"
}

if DEFAULT_MODEL not in SUPPORTED_MODELS:

    logger.warning(
        "Unknown Whisper model '%s'. Using 'small'.",
        DEFAULT_MODEL
    )

    DEFAULT_MODEL = "small"

# ==========================================================
# WHISPER SERVICE
# ==========================================================


class WhisperService:
    """
    Production Whisper Service.

    Loads Faster-Whisper exactly once and shares
    the same model across the entire application.
    """

    _instance = None

    _singleton_lock = threading.Lock()

    def __new__(cls):

        if cls._instance is None:

            with cls._singleton_lock:

                if cls._instance is None:

                    cls._instance = super().__new__(cls)

        return cls._instance

    # ------------------------------------------------------

    def __init__(self):

        if getattr(
            self,
            "_initialized",
            False
        ):

            return

        self.model = None

        self.device = "cpu"

        self.compute_type = "int8"

        self.model_name = DEFAULT_MODEL

        self.model_loaded = False

        self._transcribe_lock = threading.Lock()

        self._load_model()

        self._initialized = True

    # ======================================================
    # CUDA DETECTION
    # ======================================================

    def _cuda_available(self) -> bool:
        """
        Double verification of CUDA.
        """

        try:

            if not torch.cuda.is_available():

                return False

            torch.cuda.current_device()

            torch.cuda.get_device_name(0)

            return True

        except Exception as exc:

            logger.warning(
                "CUDA verification failed: %s",
                exc
            )

            return False

    # ======================================================
    # MODEL LOADER
    # ======================================================

    def _load_model(self):

        logger.info("=" * 70)

        logger.info(
            "Initializing Faster-Whisper..."
        )

        logger.info(
            "Requested Model : %s",
            self.model_name
        )

        if WhisperModel is None:

            logger.warning(
                "faster-whisper is not installed. Voice transcription is disabled."
            )

            return

        if self._cuda_available():

            logger.info(
                "CUDA detected."
            )

            try:

                self.model = WhisperModel(

                    self.model_name,

                    device="cuda",

                    compute_type="float16"

                )

                self.device = "cuda"

                self.compute_type = "float16"

                self.model_loaded = True

                logger.info(
                    "Whisper running on CUDA."
                )

            except Exception:

                logger.exception(
                    "CUDA initialization failed."
                )

                logger.info(
                    "Switching to CPU..."
                )

                self._load_cpu()

        else:

            logger.info(
                "CUDA unavailable."
            )

            self._load_cpu()

        logger.info("-" * 70)

        logger.info(
            "Device       : %s",
            self.device
        )

        logger.info(
            "Compute Type : %s",
            self.compute_type
        )

        logger.info(
            "Model        : %s",
            self.model_name
        )

        logger.info("=" * 70)

    # ======================================================
    # CPU FALLBACK
    # ======================================================

    def _load_cpu(self):

        self.model = WhisperModel(

            self.model_name,

            device="cpu",

            compute_type="int8"

        )

        self.device = "cpu"

        self.compute_type = "int8"

        self.model_loaded = True
    # ======================================================
    # MODEL WARMUP
    # ======================================================

    def warmup(self):

        logger.info(

            "Running Whisper warmup..."

        )

        with contextlib.suppress(Exception):

            self.model.transcribe(

                "warmup.wav",

                beam_size=1

            )

        logger.info(

            "Warmup finished."

        )
    # ======================================================
    # MODEL INFORMATION
    # ======================================================

    def model_info(self):

        return {

            "model": self.model_name,

            "device": self.device,

            "compute_type": self.compute_type,

            "cuda_available": torch.cuda.is_available(),

            "model_loaded": self.model_loaded

        }
    # ======================================================
    # HEALTH CHECK
    # ======================================================

    def is_ready(self):

        return (

            self.model_loaded

            and

            self.model is not None

        )
    # ======================================================
    # AUDIO VALIDATION
    # ======================================================

    def _validate_audio_file(
        self,
        audio_path: str
    ):

        path = Path(audio_path)

        if not path.exists():

            raise FileNotFoundError(
                f"Audio file not found: {audio_path}"
            )

        if path.stat().st_size == 0:

            raise ValueError(
                "Audio file is empty."
            )

        extension = path.suffix.lower()

        if extension not in SUPPORTED_AUDIO_FORMATS:

            raise ValueError(

                f"Unsupported audio format: {extension}"

            )

        return path

    # ======================================================
    # TRANSCRIPT NORMALIZATION
    # ======================================================

    def normalize_text(

        self,

        text: str

    ) -> str:

        if not text:

            return ""

        normalized = text.lower()

        corrections = {

            "why be i": "vibe ai",

            "why be": "vibe",

            "vive ai": "vibe ai",

            "vibe a i": "vibe ai",

            "vib ai": "vibe ai",

            "arjeet": "arijit",

            "arjeet singh": "arijit singh",

            "kishor": "kishore",

            "latta": "lata",

            "rafy": "rafi",

            "ashabhosle": "asha bhosle"

        }

        for wrong, correct in corrections.items():

            normalized = normalized.replace(

                wrong,

                correct

            )

        return normalized.strip()

    # ======================================================
    # TRANSCRIBE
    # ======================================================

    def transcribe(

        self,

        audio_path: str,

        language: Optional[str] = None,

        beam_size: int = 5

    ):

        if WhisperModel is None or not self.is_ready():

            return {

                "success": False,

                "text": "",

                "normalized_text": "",

                "language": None,

                "language_probability": None,

                "segments": [],

                "segment_count": 0,

                "error": "Voice transcription is unavailable because faster-whisper is not installed or the model is not loaded."

            }

        self._validate_audio_file(

            audio_path

        )

        logger.info("=" * 70)

        logger.info(

            "Starting Whisper transcription"

        )

        logger.info(

            "Device : %s",

            self.device

        )

        logger.info(

            "Model : %s",

            self.model_name

        )
        logger.info(

            "Audio : %s",

            audio_path

        )

        try:
            start_time = time.perf_counter()

            with self._transcribe_lock:

                segments, info = self.model.transcribe(

                audio_path,

                beam_size=beam_size,

                language=language or "en" ,

                vad_filter=False, 

                word_timestamps=False,

                temperature=0.0

            )

            transcript = []

            segment_data = []

            segments = list(segments)

            logger.info(

                "Segments returned: %d",

                len(segments)

        )

            for segment in segments:

                text = segment.text.strip()

                transcript.append(text)

                segment_data.append({

                    "start": round(segment.start, 2),

                    "end": round(segment.end, 2),

                    "text": text

                })

            final_text = " ".join(

                transcript

            ).strip()

            elapsed = round(

                time.perf_counter() - start_time,

                3

            )

            normalized_text = self.normalize_text(

                final_text

            )

            logger.info(

                "Transcription completed."

            )

            return {

                "success": True,

                "text": final_text,

                "normalized_text": normalized_text,

                "language": getattr(

                    info,

                    "language",

                    None

                ),

                "language_probability": getattr(

                    info,

                    "language_probability",

                    None

                ),

                "segments": segment_data,

                    "segment_count": len(
                        segment_data
                ),

                "processing_time": elapsed,

                "audio_file": str(audio_path),

                "file_size": Path(
                    audio_path
                ).stat().st_size

            }

        except Exception as exc:

            logger.exception(

                "Transcription failed."

            )

            return {

                "success": False,

                "text": "",

                "normalized_text": "",

                "language": None,

                "language_probability": None,

                "segments": [],

                "segment_count": 0,

                "error": str(exc)

            }
# ==========================================================
# GLOBAL SINGLETON
# ==========================================================

whisper_service = WhisperService()
