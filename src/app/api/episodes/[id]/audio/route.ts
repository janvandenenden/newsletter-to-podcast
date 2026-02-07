import { NextResponse } from "next/server";
import fs from "fs/promises";
import { episodeAudioPath, episodeExists } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!(await episodeExists(id))) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    const audioPath = episodeAudioPath(id);

    try {
      const stat = await fs.stat(audioPath);
      const fileBuffer = await fs.readFile(audioPath);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": stat.size.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Audio not yet available" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
