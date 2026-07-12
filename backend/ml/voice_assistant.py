import re


class VoiceAssistant:

    def __init__(self):

        self.mood_keywords = {

            "romantic": [
                "romantic",
                "love",
                "date"
            ],

            "rain": [
                "rain",
                "rainy",
                "monsoon"
            ],

            "workout": [
                "gym",
                "workout",
                "exercise"
            ],

            "chill": [
                "chill",
                "relax",
                "calm"
            ]

        }

    def detect_intent(
        self,
        text
    ):

        text = text.lower()

        if "surprise" in text:

            return {
                "intent":
                "surprise"
            }

        if "daily mix" in text:

            return {
                "intent":
                "daily_mix"
            }

        if "why" in text:

            return {
                "intent":
                "explain"
            }

        if (
            "playlist" in text
            or "create" in text
        ):

            return {
                "intent":
                "playlist"
            }

        if (
            "play" in text
            or "find" in text
        ):

            return {
                "intent":
                "search"
            }

        for mood, words in self.mood_keywords.items():

            if any(
                word in text
                for word in words
            ):

                return {

                    "intent":
                    "mood",

                    "mood":
                    mood

                }

        return {

            "intent":
            "search"

        }


voice_assistant = VoiceAssistant()