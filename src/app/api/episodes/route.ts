import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { MAX_INPUT_LENGTH } from "@/lib/constants";
import { initializeEpisode, runPipeline } from "@/lib/pipeline";
import { listEpisodes } from "@/lib/storage";
import { newsletterExists } from "@/lib/newsletterStorage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, newsletterIds } = body;

    const hasText = text && typeof text === "string" && text.trim().length > 0;
    const hasNewsletters =
      Array.isArray(newsletterIds) && newsletterIds.length > 0;

    if (!hasText && !hasNewsletters) {
      return NextResponse.json(
        { error: "Either text or newsletterIds is required" },
        { status: 400 }
      );
    }

    if (hasText && text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    if (hasNewsletters) {
      for (const id of newsletterIds) {
        if (!(await newsletterExists(id))) {
          return NextResponse.json(
            { error: `Newsletter not found: ${id}` },
            { status: 404 }
          );
        }
      }
    }

    const episodeId = uuidv4();

    if (hasNewsletters) {
      const meta = await initializeEpisode(episodeId, {
        sourceType: "newsletters",
        newsletterIds,
      });
      runPipeline(episodeId, "", newsletterIds);
      return NextResponse.json(meta, { status: 202 });
    } else {
      const meta = await initializeEpisode(episodeId, {
        sourceType: "paste",
        text: text.trim(),
      });
      runPipeline(episodeId, text.trim());
      return NextResponse.json(meta, { status: 202 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const episodes = await listEpisodes();
    return NextResponse.json(episodes);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
