import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { SummarySchema, type Summary } from "@/types/episode";
import { OPENAI_MODEL } from "./constants";
import { withRetry } from "./retry";

const SYSTEM_PROMPT = `You are an expert editorial analyst preparing material for a deep-dive podcast. You receive the raw text of a newsletter and extract the most important, interesting, and discussion-worthy points — with enough rich detail that podcast hosts can have a substantive, engaging conversation about each one.

Rules:
- Extract 3-6 key points. Prefer quality and depth over quantity.
- Each key point MUST include rich detail: specific facts, numbers, names, quotes, examples, and nuances. The podcast hosts need enough material to talk for several minutes per topic.
- Preserve ALL specific facts, data points, statistics, names, and direct quotes accurately. These are what make a podcast interesting — not vague summaries.
- For each point, identify what is surprising, counterintuitive, or debate-worthy. What would make a listener say "wait, really?" or "huh, I never thought of it that way."
- Explain significance in concrete, real-world terms — not abstract platitudes.
- Do NOT hallucinate or add information not present in the source.
- The title should sound like a must-listen podcast episode (engaging, specific, intriguing).
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
          content: `Here is the newsletter text to analyze. Extract rich, detailed key points with specific facts and interesting angles:\n\n---\n${text}\n---`,
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
