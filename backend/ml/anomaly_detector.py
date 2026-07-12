from sklearn.ensemble import IsolationForest
from difflib import SequenceMatcher
import numpy as np


class AnomalyDetector:

    def __init__(self):

        self.model = IsolationForest(

            contamination=0.02,

            random_state=42

        )

        self.songs = []

        self.features = []

    # =====================================
    # FEATURE EXTRACTION
    # =====================================

    def song_vector(self, song):

        title_length = len(
            song.get(
                "title",
                ""
            )
        )

        artist_length = len(
            song.get(
                "artist",
                ""
            )
        )

        genres = len(
            song.get(
                "genre",
                []
            )
        )

        moods = len(
            song.get(
                "moods",
                []
            )
        )

        duration = int(
            song.get(
                "duration_seconds",
                0
            )
        )

        has_cover = int(
            bool(
                song.get(
                    "cover_url"
                )
            )
        )

        return [

            title_length,
            artist_length,
            genres,
            moods,
            duration,
            has_cover

        ]

    # =====================================
    # BUILD MODEL
    # =====================================

    def build_index(
        self,
        songs
    ):

        self.songs = songs

        self.features = [

            self.song_vector(song)

            for song in songs

        ]

        if len(self.features) > 10:

            self.model.fit(
                self.features
            )

        print(
            f"[AnomalyDetector] "
            f"{len(songs)} songs indexed."
        )

    # =====================================
    # FIND ANOMALIES
    # =====================================

    def detect_anomalies(self):

        if not self.features:

            return []

        predictions = self.model.predict(
            self.features
        )

        anomalies = []

        for idx, value in enumerate(
            predictions
        ):

            if value == -1:

                anomalies.append(
                    self.songs[idx]
                )

        return anomalies

    # =====================================
    # DUPLICATES
    # =====================================

    def find_duplicates(
        self,
        threshold=0.95
    ):

        duplicates = []

        seen = set()

        total = len(self.songs)

        for i in range(total):

            title_a = self.songs[i].get(
                "title",
                ""
            ).lower()

            artist_a = self.songs[i].get(
                "artist",
                ""
            ).lower()

            key_a = f"{title_a}|{artist_a}"

            if key_a in seen:
                continue

            seen.add(key_a)

            for j in range(i + 1, total):

                title_b = self.songs[j].get(
                    "title",
                    ""
                ).lower()

                artist_b = self.songs[j].get(
                    "artist",
                    ""
                ).lower()

                score = SequenceMatcher(

                    None,

                    f"{title_a} {artist_a}",

                    f"{title_b} {artist_b}"

                ).ratio()

                if score >= threshold:

                    duplicates.append({

                        "song_a":
                        self.songs[i],

                        "song_b":
                        self.songs[j],

                        "similarity":
                        round(score, 3)

                    })

        return duplicates

    # =====================================
    # METADATA ISSUES
    # =====================================

    def metadata_issues(self):

        problems = []

        for song in self.songs:

            issue = []

            if not song.get("title"):
                issue.append(
                    "missing_title"
                )

            if not song.get("artist"):
                issue.append(
                    "missing_artist"
                )

            if not song.get("cover_url"):
                issue.append(
                    "missing_cover"
                )

            if not song.get("genre"):
                issue.append(
                    "missing_genre"
                )

            if not song.get("moods"):
                issue.append(
                    "missing_moods"
                )

            if issue:

                problems.append({

                    "song": song,

                    "issues": issue

                })

        return problems


anomaly_detector = AnomalyDetector()