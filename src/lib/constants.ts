import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const EPISODES_DIR = path.join(DATA_DIR, "episodes");

export const OPENAI_MODEL = "gpt-4o";

export const ELEVENLABS_MODEL = "eleven_multilingual_v2";
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";

export const VOICE_SETTINGS = {
  hostA: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.2,
    useSpeakerBoost: true,
  },
  hostB: {
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.4,
    useSpeakerBoost: true,
  },
} as const;

export const MAX_INPUT_LENGTH = 50_000;
export const TTS_DELAY_MS = 500;
