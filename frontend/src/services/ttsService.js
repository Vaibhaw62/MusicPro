import { api } from "../api";

/*
==============================================================

VibeStream TTS Service

Responsibilities

✔ Send text to FastAPI

✔ Receive MP3

✔ Play Audio

✔ Stop Previous Audio

✔ Singleton

No chatbot logic.

No avatar logic.

==============================================================
*/

class TTSService {

    constructor() {

        this.audio = null;

        this.playing = false;

        this.listeners = new Set();

    }

    //----------------------------------------------------------

    isPlaying() {

        return this.playing;

    }

    subscribe(callback) {

    this.listeners.add(callback);

    return () => {

        this.listeners.delete(callback);

    };

}

    notifySpeaking(value) {

    this.listeners.forEach(listener => {

        try {

            listener(value);

        }

        catch (err) {

            console.error(err);

        }

    });

    }

    finishSpeaking() {

        this.playing = false;

        this.notifySpeaking(false);

    }

    speakWithBrowser(

        text,

        language = "en"

    ) {

        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {

            throw new Error("Browser speech synthesis is not available.");

        }

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = language;

        utterance.rate = 1;

        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();

        const femaleVoice = voices.find((voice) => {

            const name = voice.name.toLowerCase();

            return voice.lang.toLowerCase().startsWith(language.toLowerCase().slice(0, 2)) && (

                name.includes("female") ||

                name.includes("zira") ||

                name.includes("susan") ||

                name.includes("samantha") ||

                name.includes("karen") ||

                name.includes("natasha") ||

                name.includes("google uk english female")

            );

        });

        if (femaleVoice) {

            utterance.voice = femaleVoice;

        }

        this.playing = true;

        this.notifySpeaking(true);

        utterance.onend = () => this.finishSpeaking();

        utterance.onerror = () => this.finishSpeaking();

        window.speechSynthesis.cancel();

        window.speechSynthesis.speak(utterance);

    }

    //----------------------------------------------------------

    stop() {

        if (this.audio) {

            this.audio.pause();

            this.audio.currentTime = 0;

            URL.revokeObjectURL(this.audio.src);

            this.audio = null;

        }

        if (window.speechSynthesis) {

            window.speechSynthesis.cancel();

        }

        this.playing = false;

        this.notifySpeaking(false);

    }

    //----------------------------------------------------------

    async speak(

        text,

        language = "en"

    ) {

        if (

            !text ||

            !text.trim()

        ) {

            return;

        }

        this.stop();

        let response;

        try {

            response = await api.post(

            "/tts/speak",

            {

                text,

                language

            },

            {

                responseType: "blob",

                timeout: 120000

            }

            );

        } catch (error) {

            console.warn("Backend TTS failed, using browser speech fallback:", error);

            this.speakWithBrowser(text, language);

            return;

        }

        const audioBlob = new Blob(

            [

                response.data

            ],

            {

                type:

                response.headers["content-type"] ||

                "audio/mpeg"

            }

        );

        const audioUrl = URL.createObjectURL(

            audioBlob

        );

        this.audio = new Audio(

            audioUrl

        );

        this.playing = true;

        this.notifySpeaking(true);

        this.audio.onended = () => {

            this.playing = false;

            this.notifySpeaking(false);

            URL.revokeObjectURL(

                audioUrl

            );

        };

        this.audio.onerror = () => {

            this.playing = false;

            this.notifySpeaking(false);

            URL.revokeObjectURL(

                audioUrl

            );

        };

        await this.audio.play();
    } catch (error) {
        // 3. THIS IS THE FALLBACK
        console.warn("Backend TTS failed, using browser speech fallback:", error);
        this.speakWithBrowser(text, language); 
        return;
    }

}

const ttsService = new TTSService();

export default ttsService;

// ==========================================
// ADDITIVE: MILESTONE 2 - AVATAR SYNC
// Paste this at the VERY BOTTOM of ttsService.js
// ==========================================

export const playTTSAudio = (rawAudioData, setBotState) => {
    // A Blob with a missing/wrong `type` is exactly what throws
    // "NotSupportedError: Failed to load because no supported source
    // was found." speak() above already guards against this by forcing
    // the type — this did not, so it did it here too.
    const audioBlob =
        rawAudioData instanceof Blob && rawAudioData.type
            ? rawAudioData
            : new Blob([rawAudioData], { type: "audio/mpeg" });

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Sync Avatar: When audio plays, animate the bot!
    audio.addEventListener('play', () => {
        if (setBotState) setBotState('speaking');
    });

    // Sync Avatar: When audio ends, stop the animation!
    audio.addEventListener('ended', () => {
        if (setBotState) setBotState('idle'); 
        URL.revokeObjectURL(audioUrl); // Cleanup memory
    });

    audio.addEventListener('error', (err) => {
        console.error("TTS Audio Playback Error:", err);
        if (setBotState) setBotState('idle');
        URL.revokeObjectURL(audioUrl);
    });

    audio.play().catch(error => {
        console.error("Autoplay prevented or playback failed:", error);
        if (setBotState) setBotState('idle');
    });

    return audio; 
};
