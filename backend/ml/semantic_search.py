from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import threading, torch


class SemanticSearchEngine:

    def __init__(self):

        self.model = None
        self.song_cache = []
        self.embeddings = None

        self._lock = threading.Lock()

    # ==================================================
    # LAZY MODEL LOADING
    # ==================================================

    def load_model(self):

        if self.model is not None:
            return

        with self._lock:

            if self.model is None:

                print(
                    "[SemanticSearch] Loading model..."
                )

                # Automatically select the best available device
                if torch.cuda.is_available():
                    device = "cuda"
                else:
                    device = "cpu"

                print(f"[SemanticSearch] Using device: {device}")

                self.model = SentenceTransformer(
                    "all-MiniLM-L6-v2",
                    device=device
                )

                print(
                    "[SemanticSearch] Model loaded."
                )

    # ==================================================
    # BUILD SEARCH INDEX
    # ==================================================

    def build_index(
        self,
        songs
    ):

        self.load_model()

        self.song_cache = songs

        corpus = []

        for song in songs:

            title = song.get(
                "title",
                ""
            )

            artist = song.get(
                "artist",
                ""
            )

            genres = " ".join(
                song.get(
                    "genre",
                    []
                )
            )

            moods = " ".join(
                song.get(
                    "moods",
                    []
                )
            )

            text = (
                f"{title} "
                f"{artist} "
                f"{genres} "
                f"{moods}"
            )

            corpus.append(text)

        self.embeddings = self.model.encode(
            corpus,
            show_progress_bar=True,
            normalize_embeddings=True
        )

        print(
            f"[SemanticSearch] Indexed {len(corpus)} songs."
        )

    # ==================================================
    # SEARCH
    # ==================================================

    def search(
        self,
        query,
        limit=10
    ):

        if not self.song_cache:
            return []

        if self.embeddings is None:

            raise RuntimeError(
                "Semantic index not built."
            )

        query_embedding = self.model.encode(
            [query],
            normalize_embeddings=True
        )

        scores = cosine_similarity(
            query_embedding,
            self.embeddings
        )[0]

        top_indices = np.argsort(
            scores
        )[::-1][:limit]

        results = []

        for idx in top_indices:

            song = self.song_cache[idx].copy()

            song["semantic_score"] = float(
                scores[idx]
            )

            results.append(song)

        return results

    # ==================================================
    # EXPLANATION
    # ==================================================

    def explain(
        self,
        query,
        song
    ):

        parts = []

        genres = song.get(
            "genre",
            []
        )

        moods = song.get(
            "moods",
            []
        )

        if genres:

            parts.append(
                f"genres like {', '.join(genres[:2])}"
            )

        if moods:

            parts.append(
                f"moods such as {', '.join(moods[:2])}"
            )

        explanation = (
            f"I matched this because your query "
            f"aligns with "
            f"{' and '.join(parts)}."
        )

        return explanation


# ======================================================
# SINGLETON
# ======================================================

semantic_engine = SemanticSearchEngine()