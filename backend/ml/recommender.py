from collections import Counter
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import random


class RecommendationEngine:

    def __init__(self):

        self.songs = []
        self.song_vectors = []
        self.matrix = None

        self.vocabulary = []
        self.lookup = {}

    # =====================================
    # TOKENIZATION
    # =====================================

    def vectorize(self, song):

        counter = Counter()

        title = song.get(
            "title",
            ""
        )

        artist = song.get(
            "artist",
            ""
        )

        genres = song.get(
            "genre",
            []
        )

        moods = song.get(
            "moods",
            []
        )

        language = song.get(
            "language",
            ""
        )

        counter[
            f"artist:{artist.lower()}"
        ] += 4

        counter[
            f"language:{language.lower()}"
        ] += 2

        for g in genres:

            counter[
                f"genre:{g.lower()}"
            ] += 3

        for mood in moods:

            counter[
                f"mood:{mood.lower()}"
            ] += 3

        return counter
    
    
    def build_index(self, songs):
        print(f"[DEBUG] build_index called with {len(songs)} songs")
        self.songs = songs
    
    # =====================================
    # BUILD INDEX
    # =====================================

    def build_index(self, songs):

        self.songs = songs

        vocabulary = set()

        vectors = []

        for song in songs:

            vec = self.vectorize(song)

            vectors.append(vec)

            vocabulary.update(
                vec.keys()
            )

        self.vocabulary = sorted(
            vocabulary
        )

        self.lookup = {

            token: idx

            for idx, token
            in enumerate(
                self.vocabulary
            )

        }

        matrix = []

        for vec in vectors:

            row = np.zeros(
                len(self.vocabulary)
            )

            for key, value in vec.items():

                row[
                    self.lookup[key]
                ] = value

            matrix.append(row)

        self.matrix = np.array(matrix)

        print(
            f"[RecommendationEngine] {len(songs)} songs indexed."
        )

    # =====================================
    # USER PROFILE
    # =====================================

    def build_user_profile(
        self,
        history
    ):

        profile = Counter()

        for song in history:

            vec = self.vectorize(song)

            for key, value in vec.items():

                profile[key] += value

        user_vector = np.zeros(
            len(self.vocabulary)
        )

        for key, value in profile.items():

            if key in self.lookup:

                user_vector[
                    self.lookup[key]
                ] = value

        return user_vector

    # =====================================
    # RECOMMEND
    # =====================================

    def recommend(
        self,
        history,
        limit=20
    ):

        if not history:

            return random.sample(
                self.songs,
                min(limit, len(self.songs))
            )

        profile = self.build_user_profile(
            history
        )

        similarities = cosine_similarity(
            [profile],
            self.matrix
        )[0]

        top_indices = np.argsort(
            similarities
        )[::-1]

        seen = {

            s.get("id")

            for s in history
        }

        results = []

        for idx in top_indices:
            # 🟢 FIX: Copy the FULL song object from the database, not just the ID/Score
            song = self.songs[idx].copy() 
            song["mood_score"] = float(similarities[idx])
            results.append(song)
        return results[:limit]
    # =====================================
    # DAILY MIX
    # =====================================

    def daily_mix(
        self,
        history,
        limit=25
    ):

        recommendations = self.recommend(
            history,
            limit * 2
        )

        random.shuffle(
            recommendations
        )

        return recommendations[:limit]

    # =====================================
    # SURPRISE MODE
    # =====================================

    def surprise_me(
        self,
        limit=15
    ):

        # 1. First, check if the library is empty
        if not self.songs or len(self.songs) == 0:
            return []

        # 2. Then, perform the sampling
        return random.sample(
            self.songs,
            min(
                limit,
                len(self.songs)
            )
        )
        return random.sample(

            self.songs,

            min(
                limit,
                len(self.songs)
            )

        )
        

recommendation_engine = RecommendationEngine()