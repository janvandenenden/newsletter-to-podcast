import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { SummarySchema, type Summary } from "@/types/episode";
import { OPENAI_MODEL } from "./constants";
import { withRetry } from "./retry";

const SYSTEM_PROMPT = `You are an expert editorial analyst. You receive the raw text of a newsletter and extract the most important, interesting, and discussion-worthy points.

Rules:
- Extract 3-6 key points. Prefer quality over quantity.
- Each key point should be self-contained and understandable without the original text.
- Preserve specific facts, numbers, names, and quotes accurately.
- Do NOT hallucinate or add information not present in the source.
- The title should sound like a podcast episode name (engaging but not clickbait).
- Identify the overarching theme that connects the key points.`;

export async function summarizeNewsletter(text: string): Promise<Summary> {
  const openai = new OpenAI();

  const result = await withRetry(async () => {
    const completion = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the newsletter text to analyze:\n\n---\n${text}\n---`,
        },
      ],
      response_format: zodResponseFormat(SummarySchema, "newsletter_summary"),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error("Failed to parse summary from OpenAI response");
    }
    return parsed;
  });

  return result;
}
