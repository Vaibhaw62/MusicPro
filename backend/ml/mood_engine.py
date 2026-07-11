from collections import Counter
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


MOOD_PRESETS = {
    "romantic": [
        "romantic",
        "love",
        "soft",
        "melodic",
        "heartfelt"
    ],

    "rain": [
        "rainy",
        "nostalgic",
        "calm",
        "soothing",
        "melancholic"
    ],

    "workout": [
        "energetic",
        "powerful",
        "motivational",
        "dance",
        "upbeat"
    ],

    "chill": [
        "calm",
        "relaxing",
        "ambient",
        "peaceful",
        "lofi"
    ],

    "happy": [
        "happy",
        "joyful",
        "cheerful",
        "bright",
        "fun"
    ],

    "sad": [
        "sad",
        "emotional",
        "heartbreak",
        "lonely",
        "melancholic"
    ]
}


class MoodEngine:

    def __init__(self):

        self.songs = []
        self.song_vectors = []

    # =====================================
    # VECTORIZATION
    # =====================================

    def vectorize(self, moods, genres):

        counter = Counter()

        for mood in moods:

            counter[
                f"mood:{str(mood).lower()}"
            ] += 2.0

        for genre in genres:

            counter[
                f"genre:{str(genre).lower()}"
            ] += 1.0

        return counter

    # =====================================
    # BUILD INDEX
    # =====================================

    def build_index(self, songs):

        self.songs = songs
        self.song_vectors = []

        vocabulary = set()

        for song in songs:

            moods = song.get(
                "moods",
                []
            )

            genres = song.get(
                "genre",
                []
            )

            vector = self.vectorize(
                moods,
                genres
            )

            vocabulary.update(
                vector.keys()
            )

            self.song_vectors.append(
                vector
            )

        self.vocabulary = sorted(
            vocabulary
        )

        self.index_lookup = {
            token: index
            for index, token
            in enumerate(
                self.vocabulary
            )
        }

        self.matrix = []

        for vector in self.song_vectors:

            row = np.zeros(
                len(self.vocabulary)
            )

            for key, value in vector.items():

                row[
                    self.index_lookup[key]
                ] = value

            self.matrix.append(row)

        self.matrix = np.array(
            self.matrix
        )

        print(
            f"[MoodEngine] Indexed {len(songs)} songs"
        )

    # =====================================
    # DISCOVER MOOD
    # =====================================

    def discover(
        self,
        mood_name,
        limit=15
    ):

        mood_name = mood_name.lower()
        if len(self.songs) == 0:
            return []

        if len(self.matrix) == 0:
            return []
        mood_tokens = MOOD_PRESETS.get(
            mood_name,
            [mood_name]
        )

        query_vector = Counter()

        for token in mood_tokens:

            query_vector[
                f"mood:{token}"
            ] += 2.0

        query = np.zeros(
            len(self.vocabulary)
        )

        for key, value in query_vector.items():

            if key in self.index_lookup:

                query[
                    self.index_lookup[key]
                ] = value
            if len(self.songs) == 0:
                return []

            if len(self.matrix) == 0:
                return []
        similarities = cosine_similarity(
            [query],
            self.matrix
        )[0]

        top_indices = np.argsort(
            similarities
        )[::-1][:limit]

        results = []

        for idx in top_indices:
            # 🟢 FIX: Copy the FULL song object from the database, not just the ID/Score
            song = self.songs[idx].copy() 
            song["mood_score"] = float(similarities[idx])
            results.append(song)

        return results

    # =====================================
    # EXPLANATION
    # =====================================

    def explain(self, mood):

        mood = mood.lower()

        if mood in MOOD_PRESETS:

            return (
                f"I searched for songs with "
                f"{', '.join(MOOD_PRESETS[mood][:3])} "
                f"characteristics."
            )

        return (
            f"I searched for music matching "
            f"the mood '{mood}'."
        )


mood_engine = MoodEngine()