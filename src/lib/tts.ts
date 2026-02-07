import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from "fs/promises";
import path from "path";
import {
  ELEVENLABS_MODEL,
  ELEVENLABS_OUTPUT_FORMAT,
  VOICE_SETTINGS,
  TTS_DELAY_MS,
} from "./constants";
import { segmentsDir } from "./storage";
import { withRetry } from "./retry";
import type { DialogueSegment } from "@/types/episode";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

function getVoiceId(speaker: "hostA" | "hostB"): string {
  const envKey =
    speaker === "hostA"
      ? "ELEVENLABS_VOICE_HOST_A"
      : "ELEVENLABS_VOICE_HOST_B";
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`Missing environment variable: ${envKey}`);
  }
  return id;
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface TtsProgress {
  current: number;
  total: number;
}

export async function generateAllAudio(
  segments: DialogueSegment[],
  episodeId: string,
  onProgress?: (progress: TtsProgress) => void
): Promise<void> {
  const outDir = segmentsDir(episodeId);

  // Track previous request IDs per speaker for prosody continuity
  const previousIds: Record<string, string[]> = {
    hostA: [],
    hostB: [],
  };

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const speaker = segment.speaker;
    const voiceId = getVoiceId(speaker);
    const settings = VOICE_SETTINGS[speaker];

    const filePath = path.join(
      outDir,
      `${String(i).padStart(3, "0")}-${speaker}.mp3`
    );

    const response = await withRetry(async () => {
      return client.textToSpeech
        .convert(voiceId, {
          text: segment.text,
          modelId: ELEVENLABS_MODEL,
          outputFormat: ELEVENLABS_OUTPUT_FORMAT,
          voiceSettings: {
            stability: settings.stability,
            similarityBoost: settings.similarityBoost,
            style: settings.style,
            useSpeakerBoost: settings.useSpeakerBoost,
          },
          previousRequestIds: previousIds[speaker].slice(-3),
        })
        .withRawResponse();
    });

    const buffer = await streamToBuffer(response.data);
    await fs.writeFile(filePath, buffer);

    // Extract request ID from headers for continuity
    const requestId = response.rawResponse.headers.get("request-id");
    if (requestId) {
      previousIds[speaker].push(requestId);
    }

    onProgress?.({ current: i + 1, total: segments.length });

    // Delay between requests to avoid rate limits
    if (i < segments.length - 1) {
      await delay(TTS_DELAY_MS);
    }
  }
}
