import { z } from "zod";

// --- Zod Schemas (used for OpenAI structured outputs) ---

export const KeyPointSchema = z.object({
  topic: z.string().describe("Short topic label, 2-4 words"),
  summary: z.string().describe("2-3 sentence summary of this point"),
  significance: z.string().describe("Why this matters to the audience, 1 sentence"),
});

export const SummarySchema = z.object({
  title: z.string().describe("A concise podcast episode title, 5-10 words"),
  overallTheme: z
    .string()
    .describe("The overarching theme tying these points together"),
  keyPoints: z
    .array(KeyPointSchema)
    .describe("3-6 key points extracted from the newsletter"),
});

export const DialogueSegmentSchema = z.object({
  speaker: z.enum(["hostA", "hostB"]),
  text: z.string().describe("The spoken dialogue line, 1-4 sentences"),
  topic: z
    .string()
    .optional()
    .describe("Which key point this relates to"),
});

export const DialogueScriptSchema = z.object({
  segments: z.array(DialogueSegmentSchema),
});

// --- TypeScript types ---

export type KeyPoint = z.infer<typeof KeyPointSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type DialogueSegment = z.infer<typeof DialogueSegmentSchema>;
export type DialogueScript = z.infer<typeof DialogueScriptSchema>;

export type EpisodeStatus =
  | "processing"
  | "summarizing"
  | "scripting"
  | "generating_audio"
  | "complete"
  | "error";

export interface EpisodeMeta {
  id: string;
  title: string;
  createdAt: string;
  status: EpisodeStatus;
  duration?: number;
  segmentCount?: number;
  totalSegments?: number;
  currentSegment?: number;
  sourceTextPreview: string;
  error?: string;
}
