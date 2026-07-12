# Project Memory: VibeStream / MusicPro

Last updated: 2026-07-09

## Core Goal

Build a Render-deployable full-stack music streaming platform with a premium React UI, FastAPI backend, MongoDB cloud sync, Telegram bot based audio streaming, and intelligent music discovery through recommendations, semantic search, mood discovery, voice commands, and TTS.

## Non-Negotiable Update Rules

1. Preserve existing achieved functionality unless the user explicitly asks to remove it.
2. Make minimal, targeted updates. Change only the exact files and lines needed for the requested fix.
3. Prefer extension and repair over rewrites.
4. Keep frontend, backend, database schema expectations, and Render deployment compatibility aligned.
5. Before editing, understand the surrounding feature and dependencies.
6. After editing, state exactly what changed, where, and why.
7. Do not trade one working feature for another. Every update must keep previously collected progress intact.
8. For future fixes, provide line-level guidance when useful: current line/block, replacement line/block, and impact.

## Current Architecture

- Frontend: React 19 + Vite application in `frontend/`.
- Frontend state: Zustand persisted store in `frontend/src/musicStore.js`.
- Backend: FastAPI application in `backend/main.py`.
- Database: MongoDB via Motor, using `master_library`, `users`, and bot-related collections.
- Audio delivery: Telegram bot worker swarm through Telethon in `backend/bot_manager.py`, exposed by `/stream/{msg_id}`.
- Auth: JWT login/register endpoints with PBKDF2 password hashing.
- AI/music modules: semantic search, mood discovery, recommendations, explainability, anomaly detection, voice assistant, context manager, taste memory, Whisper transcription, and TTS.
- Deployment target: Render. Backend reads `PORT`, `JWT_SECRET`, `MONGO_URL`, Telegram credentials, and optional Cloudflare LLM credentials from environment variables.

## Completed Functionality To Preserve

- Login/register and persisted authenticated session.
- Cloud sync of liked songs, recently played songs, play events, volume, and selected language.
- Song browsing from MongoDB with search, genre, mood, duration, language filters, deduplication, normalization, and infinite scroll.
- Personalized recommendations from user taste signals.
- Telegram-backed audio streaming with range request support and stream concurrency limits.
- Full music player with play/pause, next/previous, seek, volume, mute, like, mini/fullscreen player state.
- Home playlists including daily playlist, Kishore Royale, Velvet 80s-90s, and Bengal Gold.
- Mobile sidebar and bottom navigation.
- Vibe AI chatbot surface with quick actions, mood discovery, surprise, daily mix, explainability, metadata tools, voice recognition, wake-word flow, dynamic greeting, and TTS playback.
- Voice upload/transcription route and command parsing route.
- TTS route that returns audio bytes.
- ML index building during FastAPI lifespan startup.

## Current Known Risks / Problems To Investigate

- `backend/routes/bot_router.py` mixes async Motor collections with synchronous PyMongo-style calls in several routes.
- `PersonalizedRequest` in `backend/routes/bot_router.py` does not define `user_id`, but `/bot/personalized` reads `payload.user_id`.
- `backend/requirements.txt` appears incomplete for imports used by the app: `sentence_transformers`, `scikit-learn`, `numpy`, `torch`, `requests`, and likely Whisper/TTS-related packages are imported but not listed.
- `backend/bot_manager.py` casts required environment variables with `int(os.getenv(...))`; missing values can crash import/startup before FastAPI can respond cleanly.
- `backend/ml/semantic_search.py` loads SentenceTransformer during startup, which may be heavy for Render cold starts and may require large dependencies.
- `frontend/src/api.js` hardcodes the production backend URL; this must match Render service names or be moved to env config for safer deployment.
- Some source files contain mojibake text from emoji/encoding issues. This is mostly cosmetic but makes maintenance harder.
- `frontend/src/components/musicbot.jsx` is large and duplicated in parts, increasing regression risk when editing.
- No Git repository is active from the current workspace root, so changes need extra manual care.

## Future Work Discipline

For every future update:

1. Identify the existing feature that owns the behavior.
2. Trace callers and dependent state/API contracts.
3. Patch the smallest block possible.
4. Preserve all unrelated code.
5. Run the closest available validation command.
6. Report changed files and verification results.
