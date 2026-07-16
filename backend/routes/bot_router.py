from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random, logging, traceback 
import os,traceback,sys,re 
from ml.semantic_search import semantic_engine
from ml.mood_engine import mood_engine
from ml.recommender import recommendation_engine
from ml.explainability import explainability_engine
from ml.anomaly_detector import anomaly_detector
from ml.voice_assistant import voice_assistant
from ml.taste_memory import taste_memory
from database import db
from ml.context_manager import context_manager
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.llm_service import llm_service
from datetime import datetime

router = APIRouter(
    prefix="/bot",
    tags=["AI Music Bot"]
)


# =====================================================
# DATABASE
# =====================================================

songs_collection = db.master_library
history_collection = db.user_history


# =====================================================
# REQUEST MODELS
# =====================================================

class RecommendRequest(BaseModel):
    user_id: str
    mode: str = "surprise"


class ExplainRequest(BaseModel):
    song_id: str


class MoodRequest(BaseModel):
    mood: str
    limit: int = 30
    exclude_ids: list= []


class HistoryRequest(BaseModel):
    user_id: str

class PersonalizedRequest(BaseModel):
    user_id: str = "anonymous"
    history: list = []
    limit: int = 20

class ExplainRecommendationRequest(BaseModel):

    history: list = []

    song: dict

    similarity_score: float = 0.0

class MaintenanceRequest(BaseModel):

    action: str

class VoiceCommandRequest(BaseModel):

    text: str

class TasteProfileRequest(BaseModel):

    user_id: str

    songs: list
class ContextRequest(BaseModel):
    user_id: str
    message: str
    last_songs: list = []


class KeywordSearchRequest(BaseModel):
    query: str
    limit: int = 30



# =====================================================
# HELPERS
# =====================================================

def serialize_song(song):

    return {
        "id": str(song.get("_id", "")),
        "title": song.get("title", "Unknown"),
        "artist": song.get("artist", "Unknown"),
        "genre": song.get("genre", []),
        "moods": song.get("moods", []),
        "cover_url": song.get("cover_url")
    }


# =====================================================
# SURPRISE / RECOMMEND
# =====================================================

@router.post("/recommend")
async def recommend_music(
    payload: RecommendRequest
):

    songs = list(
        songs_collection.aggregate(
            [{"$sample": {"size": 10}}]
        )
    )

    return {
        "results": [
            serialize_song(s)
            for s in songs
        ]
    }


# =====================================================
# EXPLAIN RECOMMENDATION
# =====================================================

@router.post("/explain")
async def explain_song(
    payload: ExplainRequest
):

    song = songs_collection.find_one(
        {
            "$or": [
                {"_id": payload.song_id},
                {"id": payload.song_id}
            ]
        }
    )

    if not song:

        return {
            "explanation":
            "I recommended this because it matches your recent listening patterns."
        }

    genres = song.get(
        "genre",
        []
    )

    moods = song.get(
        "moods",
        []
    )

    explanation = (
        f"This track fits because it contains "
        f"{', '.join(genres[:2])} influences "
        f"and evokes "
        f"{', '.join(moods[:2])} moods."
    )

    return {
        "explanation": explanation
    }


# =====================================================
# MOOD DISCOVERY
# =====================================================

@router.post("/discover-mood")
async def discover_mood(payload: MoodRequest):
    try:
        results = mood_engine.discover(
            payload.mood,
            limit=payload.limit,
            exclude_ids=payload.exclude_ids
        )
        explanation = mood_engine.explain(payload.mood)
        return {
            "results": results,
            "explanation": explanation
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
# =====================================================
# USER HISTORY / TASTE PROFILE
# =====================================================

@router.post("/history")
async def get_user_history(
    payload: HistoryRequest
):

    records = list(
        history_collection.find(
            {
                "user_id":
                payload.user_id
            }
        )
    )

    genres = set()
    moods = set()
    artists = set()

    for item in records:

        for g in item.get(
            "genres",
            []
        ):
            genres.add(g)

        for m in item.get(
            "moods",
            []
        ):
            moods.add(m)

        artist = item.get(
            "artist"
        )

        if artist:
            artists.add(artist)

    return {
        "profile": {

            "genres":
            list(genres),

            "moods":
            list(moods),

            "artists":
            list(artists)

        }
    }


# =====================================================
# HEALTH CHECK
# =====================================================

@router.get("/health")
async def bot_health():

    return {
        "status": "ok",
        "service": "vibestream-ai"
    }

@router.post("/semantic-search")
async def semantic_search(payload: dict):

    query = payload.get("query", "")
    limit = payload.get("limit", 10)

    try:

        results = semantic_engine.search(
            query,
            limit
        )

        explanation = ""

        if results:

            explanation = semantic_engine.explain(
                query,
                results[0]
            )

        return {
            "results": results,
            "explanation": explanation
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


bot_logger = logging.getLogger("BotRouter")

# Replace your current /personalized block with this:

@router.post("/personalized")
async def personalized_recommendations(payload: PersonalizedRequest):
    try:
        # 1. Fetch history from DB if payload history is empty
        if not payload.history or len(payload.history) == 0:
            user_history = await history_collection.find({"user_id": payload.user_id}).sort("_id", -1).limit(50).to_list(length=50)
            payload.history = user_history
            
        # 2. If history is still empty (new user), return a safe surprise mix immediately
        if not payload.history:
            fallback_songs = recommendation_engine.surprise_me(limit=payload.limit)
            return {
                "results": fallback_songs,
                "explanation": "You're new here! Enjoy this surprise mix while I learn your taste."
            }

        # 3. Generate personalized recommendations using the engine
        results = recommendation_engine.recommend(
            payload.history,
            payload.limit
        )
        
        # 4. Final safety check: if engine returns empty for some reason, use surprise_me
        if not results:
            results = recommendation_engine.surprise_me(limit=payload.limit)
            explanation = "I'm still learning your unique taste. Here is a curated surprise mix!"
        else:
            explanation = "Generated using your listening history."
        
        return {
            "results": results,
            "explanation": explanation
        }
        
    except Exception as exc:
        # 5. Global Exception Handler: Log the error and return a safe fallback
        bot_logger.error(f"Critical failure in RecommendationEngine: {str(exc)}")
        bot_logger.error(traceback.format_exc())
        
        # Always return a 200 OK with a fallback so the UI doesn't break
        fallback_songs = recommendation_engine.surprise_me(limit=payload.limit)
        return {
            "results": fallback_songs,
            "explanation": "I'm having a little trouble processing your taste profile right now, so here's a surprise mix!"
        } 
@router.post("/daily-mix")
async def daily_mix(
        payload: PersonalizedRequest
    ):

    try:

        songs = recommendation_engine.daily_mix(

            payload.history,

            payload.limit

        )

        return {

            "title":
            "Vibe Daily Mix",

            "results":
            songs

        }

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=str(exc)

        )
@router.get("/surprise")
async def surprise_me():

    songs = recommendation_engine.surprise_me()

    return {

        "results": songs,

        "message":
        "Enjoy something unexpected 🎵"

    }

@router.post("/why")
async def why_recommended(
    payload: ExplainRecommendationRequest
    ):

    try:

        reasons = explainability_engine.explain_song(

            history=payload.history,

            song=payload.song,

            similarity_score=payload.similarity_score

        )

        return {

            "reasons": reasons

        }

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=str(exc)

        )

@router.post("/maintenance")
async def maintenance(
    payload: MaintenanceRequest
):

    try:

        action = payload.action

        if action == "find_duplicates":

            return {

                "duplicates":
                anomaly_detector.find_duplicates()

            }

        if action == "metadata":

            return {

                "issues":
                anomaly_detector.metadata_issues()

            }

        if action == "anomalies":

            return {

                "anomalies":
                anomaly_detector.detect_anomalies()

            }

        raise HTTPException(

            status_code=400,

            detail="Unknown action"

        )

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=str(exc)

        )

@router.post("/voice-command")
async def voice_command(
    payload: VoiceCommandRequest
):

    return voice_assistant.detect_intent(
        payload.text
    )

@router.post("/taste-profile")
async def update_taste_profile(
    payload: TasteProfileRequest
):

    try:
        print("=" * 80)
        print(type(db))
        print(type(db.user_taste_profiles))
        print("=" * 80)
        profile = await taste_memory.update_profile(

            db,

            payload.user_id,

            payload.songs

        )

        return profile

    except Exception as e:

        import traceback

        print("\n" + "=" * 100)
        print("ERROR INSIDE /bot/taste-profile")
        traceback.print_exc()
        print("=" * 100 + "\n")

        raise
@router.post("/context")
async def update_context(
    payload: ContextRequest
):

    user_id = payload.user_id

    message = payload.message.lower()

    ctx = context_manager.get_context(
        user_id
    )

    update = {}

    if "sadder" in message:

        update["mood"] = "sad"

    elif "romantic" in message:

        update["mood"] = "romantic"

    elif "workout" in message:

        update["mood"] = "workout"

    elif "like the previous" in message:

        update["similar_to_previous"] = True

    if payload.last_songs:

        update["last_songs"] = payload.last_songs

    ctx = context_manager.update_context(

        user_id,

        update

    )

    return ctx

    # Add this request model
class GreetingRequest(BaseModel):
    username: str = "Friend"

# Add this route function
@router.post("/dynamic-greeting")
async def dynamic_greeting(payload: GreetingRequest):
    """Fetches an NLP-generated greeting."""
    try:
        # Calculate time of day for context
        hour = datetime.now().hour
        if 5 <= hour < 12:
            time_of_day = "morning"
        elif 12 <= hour < 17:
            time_of_day = "afternoon"
        elif 17 <= hour < 22:
            time_of_day = "evening"
        else:
            time_of_day = "night"

        # Call our new Cloudflare LLM
        dynamic_text = llm_service.generate_greeting(payload.username, time_of_day)
        
        return {"greeting": dynamic_text}
    except Exception as exc:
        # Safe fallback
        return {"greeting": f"Hello {payload.username}, what would you like to hear?"}
    
@router.post("/search")
async def keyword_search(payload: KeywordSearchRequest):

    query = payload.query.strip()
    if not query:
        return {"results": [], "query": ""}

    tokens = query.split()

    and_conditions = []

    for token in tokens:
        token_escaped = re.escape(token)

        or_clause = {
            "$or": [
                {"title": {"$regex": token_escaped, "$options": "i"}},
                {"artist_name": {"$regex": token_escaped, "$options": "i"}},
                {"artist": {"$regex": token_escaped, "$options": "i"}},
                {"album": {"$regex": token_escaped, "$options": "i"}},
                {"genre": {"$regex": token_escaped, "$options": "i"}},
                {"moods": {"$regex": token_escaped, "$options": "i"}},
            ]
        }

        # Purely numeric token (e.g. "1997") also matches year exactly
        if token.isdigit():
            or_clause["$or"].append({"year": int(token)})

        and_conditions.append(or_clause)

    mongo_query = {"$and": and_conditions} if and_conditions else {}

    cursor = songs_collection.find(mongo_query).limit(payload.limit)
    results = await cursor.to_list(length=payload.limit)

    return {
        "results": [serialize_song(s) for s in results],
        "query": query,
        "matched_tokens": tokens
    }
    
    