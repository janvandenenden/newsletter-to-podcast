import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { MAX_INPUT_LENGTH } from "@/lib/constants";
import { initializeEpisode, runPipeline } from "@/lib/pipeline";
import { listEpisodes } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const episodeId = uuidv4();
    const meta = await initializeEpisode(episodeId, text.trim());

    // Fire-and-forget: start pipeline without awaiting
    runPipeline(episodeId, text.trim());

    return NextResponse.json(meta, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
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
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
