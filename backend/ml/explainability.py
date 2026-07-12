from collections import Counter


class ExplainabilityEngine:

    def __init__(self):
        pass

    # =====================================
    # BUILD USER PROFILE
    # =====================================

    def profile_summary(self, history):

        artists = Counter()
        genres = Counter()
        moods = Counter()

        for song in history:

            artist = (
                song.get("artist")
                or song.get("artist_name")
            )

            if artist:
                artists[artist] += 1

            for genre in song.get(
                "genre",
                []
            ):
                genres[genre] += 1

            for mood in song.get(
                "moods",
                []
            ):
                moods[mood] += 1

        return {

            "artists":
            artists.most_common(5),

            "genres":
            genres.most_common(5),

            "moods":
            moods.most_common(5)

        }

    # =====================================
    # EXPLAIN RECOMMENDATION
    # =====================================

    def explain_song(
        self,
        history,
        song,
        similarity_score=0.0
    ):

        profile = self.profile_summary(
            history
        )

        reasons = []

        # ---------------------------------
        # ARTIST MATCH
        # ---------------------------------

        top_artists = [
            artist
            for artist, _
            in profile["artists"]
        ]

        artist_name = song.get(
            "artist"
        )

        if artist_name in top_artists:

            reasons.append(

                f"You frequently listen to "
                f"{artist_name}."

            )

        # ---------------------------------
        # GENRE MATCH
        # ---------------------------------

        favourite_genres = [

            genre
            for genre, _
            in profile["genres"]

        ]

        song_genres = song.get(
            "genre",
            []
        )

        matching_genres = [

            genre
            for genre in song_genres
            if genre in favourite_genres

        ]

        if matching_genres:

            reasons.append(

                "Matching genres: "
                + ", ".join(
                    matching_genres[:3]
                )

            )

        # ---------------------------------
        # MOOD MATCH
        # ---------------------------------

        favourite_moods = [

            mood
            for mood, _
            in profile["moods"]

        ]

        song_moods = song.get(
            "moods",
            []
        )

        matching_moods = [

            mood
            for mood in song_moods
            if mood in favourite_moods

        ]

        if matching_moods:

            reasons.append(

                "Similar moods: "
                + ", ".join(
                    matching_moods[:3]
                )

            )

        # ---------------------------------
        # SIMILARITY
        # ---------------------------------

        if similarity_score > 0:

            reasons.append(

                f"Recommendation confidence: "
                f"{round(similarity_score * 100, 1)}%"

            )

        if not reasons:

            reasons.append(
                "This track introduces a fresh musical experience."
            )

        return reasons


explainability_engine = ExplainabilityEngine()