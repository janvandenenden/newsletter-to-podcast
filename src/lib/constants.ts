import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const EPISODES_DIR = path.join(DATA_DIR, "episodes");

export const OPENAI_MODEL = "gpt-4o";

export const ELEVENLABS_MODEL = "eleven_v3";
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";

// v3 stability only accepts 0.0 (Creative), 0.5 (Natural), or 1.0 (Robust)
// Using Creative (0.0) for maximum expressiveness with audio tags
export const VOICE_SETTINGS = {
  hostA: {
    stability: 0.0,
    similarityBoost: 0.7,
    style: 0.4,
    useSpeakerBoost: true,
  },
  hostB: {
    stability: 0.0,
    similarityBoost: 0.7,
    style: 0.5,
    useSpeakerBoost: true,
  },
} as const;

export const MAX_INPUT_LENGTH = 50_000;
export const TTS_DELAY_MS = 500;
