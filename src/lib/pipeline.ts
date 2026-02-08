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
import {
  readNewsletterMeta,
  readNewsletterContent,
  markNewsletterUsed,
} from "./newsletterStorage";
import type { EpisodeMeta } from "@/types/episode";

export async function assembleNewsletterText(
  newsletterIds: string[]
): Promise<string> {
  const parts: string[] = [];
  for (const id of newsletterIds) {
    const meta = await readNewsletterMeta(id);
    const content = await readNewsletterContent(id);
    parts.push(`--- Newsletter: "${meta.subject}" (from ${meta.sender}) ---\n${content}`);
  }
  return parts.join("\n\n");
}

export async function runPipeline(
  episodeId: string,
  text: string,
  newsletterIds?: string[]
): Promise<void> {
  try {
    // Assemble source text
    let sourceText = text;
    if (newsletterIds?.length) {
      sourceText = await assembleNewsletterText(newsletterIds);
    }

    // Stage 1: Summarize
    await updateMeta(episodeId, { status: "summarizing" });
    const summary = await summarizeNewsletter(sourceText);

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

    // Mark newsletters as used
    if (newsletterIds?.length) {
      for (const nlId of newsletterIds) {
        await markNewsletterUsed(nlId, episodeId);
      }
    }

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

interface InitEpisodeOptions {
  sourceType: "paste" | "newsletters";
  text?: string;
  newsletterIds?: string[];
}

export async function initializeEpisode(
  episodeId: string,
  opts: InitEpisodeOptions
): Promise<EpisodeMeta> {
  await createEpisodeDir(episodeId);

  const preview = opts.text?.slice(0, 200) ?? "";

  const meta: EpisodeMeta = {
    id: episodeId,
    title: "Processing...",
    createdAt: new Date().toISOString(),
    status: "processing",
    sourceTextPreview: preview,
    sourceType: opts.sourceType,
    sourceNewsletterIds: opts.newsletterIds,
  };

  await writeMeta(episodeId, meta);
  return meta;
}
