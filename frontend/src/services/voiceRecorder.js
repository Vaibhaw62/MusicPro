import axios from "axios";
import { API_URL } from "../api";
/*
==============================================================

VibeStream Voice Recorder

Responsibilities

✔ Request microphone permission

✔ Record microphone audio

✔ Upload audio to FastAPI

✔ Receive transcript

✔ Return structured result

No chatbot logic belongs here.

==============================================================
*/

class VoiceRecorder {

    constructor() {

        this.mediaRecorder = null;

        this.stream = null;

        this.audioChunks = [];

        this.recording = false;

        this.uploading = false;

        this.mimeType = "";

        this.audioBlob = null;

        this.audioFile = null;

    }

    //----------------------------------------------------------

    async initialize() {

        if (this.stream) {

            return;

        }

        this.stream = await navigator.mediaDevices.getUserMedia({

            audio: {

                echoCancellation: true,

                noiseSuppression: true,

                autoGainControl: true

            }

        });

    }

    //----------------------------------------------------------

    isRecording() {

        return this.recording;

    }

    //----------------------------------------------------------

    isUploading() {

        return this.uploading;

    }

    //----------------------------------------------------------

    async startRecording() {

        if (this.recording) {

            throw new Error(

                "Recording already in progress."

            );

        }

        await this.initialize();

        this.audioChunks = [];

        this.audioBlob = null;

        this.audioFile = null;

        const preferredTypes = [

            "audio/webm;codecs=opus",

            "audio/webm",

            "audio/mp4",

            "audio/ogg"

        ];

        this.mimeType = "";

        for (const type of preferredTypes) {

            if (

                MediaRecorder.isTypeSupported(type)

            ) {

                this.mimeType = type;

                break;

            }

        }

        if (!this.mimeType) {

            throw new Error(

                "No supported recording format found."

            );

        }

        this.mediaRecorder = new MediaRecorder(

            this.stream,

            {

                mimeType: this.mimeType

            }

        );

        this.mediaRecorder.ondataavailable = (

            event

        ) => {

            if (

                event.data

                &&

                event.data.size > 0

            ) {

                this.audioChunks.push(

                    event.data

                );

            }

        };

        this.mediaRecorder.start();

        this.recording = true;

        console.log(

            "🎤 Recording Started"

        );

    }

    //----------------------------------------------------------

    stopRecording() {

        return new Promise((resolve, reject) => {

            if (

                !this.recording ||

                !this.mediaRecorder

            ) {

                reject(

                    new Error(

                        "No recording in progress."

                    )

                );

                return;

            }

            this.mediaRecorder.onstop = () => {

                try {

                    this.audioBlob = new Blob(

                        this.audioChunks,

                        {

                            type: this.mimeType

                        }

                    );

                    this.audioFile = new File(

                        [

                            this.audioBlob

                        ],

                        "voice.webm",

                        {

                            type: this.mimeType

                        }

                    );

                    this.recording = false;

                    console.log(

                        "🛑 Recording Stopped"

                    );

                    console.log(

                        "Blob Size:",

                        this.audioBlob.size

                    );

                    resolve(

                        this.audioFile

                    );

                }

                catch (error) {

                    reject(

                        error

                    );

                }

            };

            this.mediaRecorder.stop();

        });

    }

        //----------------------------------------------------------

    async uploadRecording() {

        if (

            !this.audioFile

        ) {

            throw new Error(

                "No recording available."

            );

        }

        if (

            this.uploading

        ) {

            throw new Error(

                "Upload already in progress."

            );

        }

        this.uploading = true;

        try {

            const formData = new FormData();

            formData.append(

                "audio",

                this.audioFile

            );

            const response = await axios.post(

                `${API_URL}/voice/transcribe`,

                formData,

                {

                    headers: {

                        "Content-Type":

                            "multipart/form-data"

                    },

                    timeout: 120000

                }

            );

            console.log(

                "🎤 Whisper Response",

                response.data

            );

            return response.data;

        }

        finally {

            this.uploading = false;

        }

    }

}

const voiceRecorder = new VoiceRecorder();

export default voiceRecorder;