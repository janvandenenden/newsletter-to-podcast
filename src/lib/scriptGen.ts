import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  DialogueScriptSchema,
  type DialogueScript,
  type Summary,
} from "@/types/episode";
import { OPENAI_MODEL } from "./constants";
import { withRetry } from "./retry";

const SYSTEM_PROMPT = `You are a podcast script writer. You create natural, engaging two-host dialogue scripts from a set of key points.

HOST A ("Alex"): The lead host. Introduces topics, provides context, explains significance. Slightly more authoritative tone. Guides the conversation flow.

HOST B ("Sam"): The co-host. Reacts authentically, asks clarifying questions, adds color commentary, offers alternative perspectives, occasionally makes light observations. More casual and conversational.

Script structure:
1. Cold open: Host A introduces the episode theme with energy (1-2 lines)
2. Host B reacts to the theme, sets expectations (1 line)
3. For each key point:
   - Host A introduces the topic and key facts
   - Host B reacts, asks a question, or adds perspective
   - Brief back-and-forth (2-4 total exchanges per topic)
   - Natural transition to next topic
4. Wrap-up: Both hosts summarize takeaways (2-3 lines)
5. Sign-off: Brief, friendly outro (1-2 lines)

Rules:
- Total script should be 15-30 segments.
- Each segment is 1-4 sentences. Keep it punchy.
- Use conversational language. Contractions are good. Avoid jargon.
- Include natural filler/reactions: "Right", "Exactly", "That's interesting", etc.
- Never say "as an AI" or break character.
- The dialogue should feel like two real people discussing the newsletter naturally.
- Attribute all facts to the newsletter source. Say "according to the newsletter" or "they report that" -- never present facts as the hosts' own research.
- Light humor is encouraged but keep it natural, not forced.`;

export async function generateScript(summary: Summary): Promise<DialogueScript> {
  const openai = new OpenAI();

  const keyPointsList = summary.keyPoints
    .map(
      (kp, i) =>
        `${i + 1}. **${kp.topic}**: ${kp.summary}\n   Significance: ${kp.significance}`
    )
    .join("\n\n");

  const result = await withRetry(async () => {
    const completion = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a podcast dialogue script based on these key points:\n\nTitle: ${summary.title}\nOverall Theme: ${summary.overallTheme}\n\nKey Points:\n${keyPointsList}`,
        },
      ],
      response_format: zodResponseFormat(
        DialogueScriptSchema,
        "dialogue_script"
      ),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error("Failed to parse dialogue script from OpenAI response");
    }
    return parsed;
  });

  return result;
}
