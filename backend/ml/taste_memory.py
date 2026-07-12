from collections import Counter
from datetime import datetime


class TasteMemory:

    async def update_profile(
        self,
        db,
        user_id,
        songs
    ):

        artists = Counter()
        genres = Counter()
        moods = Counter()
        languages = Counter()

        for song in songs:

            artist = (
                song.get("artist")
                or song.get("artist_name")
            )

            if artist:
                artists[artist] += 1

            for g in song.get(
                "genre",
                []
            ):
                genres[g] += 1

            for m in song.get(
                "moods",
                []
            ):
                moods[m] += 1

            lang = song.get(
                "language"
            )

            if lang:
                languages[lang] += 1

        profile = {

            "user_id":
            user_id,

            "favorite_artists":
            [x[0] for x in artists.most_common(10)],

            "favorite_genres":
            [x[0] for x in genres.most_common(10)],

            "favorite_moods":
            [x[0] for x in moods.most_common(10)],

            "favorite_languages":
            [x[0] for x in languages.most_common(5)],

            "total_songs_played":
            len(songs),

            "last_updated":
            datetime.utcnow()

        }

        await db.user_taste_profiles.update_one(

            {"user_id": user_id},

            {"$set": profile},

            upsert=True

        )

        return profile


taste_memory = TasteMemory()