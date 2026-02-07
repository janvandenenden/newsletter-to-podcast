import { summarizeNewsletter } from "./summarize";
import { generateScript } from "./scriptGen";
import { generateAllAudio } from "./tts";
import { concatenateSegments } from "./audioConcat";
import {
  createEpisodeDir,
  writeMeta,
  updateMeta,
  writeScript,
} from "./storage";
import type { EpisodeMeta } from "@/types/episode";

export async function runPipeline(
  episodeId: string,
  text: string
): Promise<void> {
  try {
    // Stage 1: Summarize
    await updateMeta(episodeId, { status: "summarizing" });
    const summary = await summarizeNewsletter(text);

    // Update title from summary
    await updateMeta(episodeId, {
      title: summary.title,
      status: "scripting",
    });

    // Stage 2: Generate Script
    const script = await generateScript(summary);
    await writeScript(episodeId, script);

    await updateMeta(episodeId, {
      status: "generating_audio",
      totalSegments: script.segments.length,
      currentSegment: 0,
    });

    // Stage 3: Generate Audio
    await generateAllAudio(script.segments, episodeId, async (progress) => {
      await updateMeta(episodeId, {
        currentSegment: progress.current,
      });
    });

    // Stage 4: Concatenate
    const duration = await concatenateSegments(episodeId);

    // Done
    await updateMeta(episodeId, {
      status: "complete",
      duration,
      segmentCount: script.segments.length,
    });
  } catch (error) {
    await updateMeta(episodeId, {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function initializeEpisode(
  episodeId: string,
  text: string
): Promise<EpisodeMeta> {
  await createEpisodeDir(episodeId);

  const meta: EpisodeMeta = {
    id: episodeId,
    title: "Processing...",
    createdAt: new Date().toISOString(),
    status: "processing",
    sourceTextPreview: text.slice(0, 200),
  };

  await writeMeta(episodeId, meta);
  return meta;
}
