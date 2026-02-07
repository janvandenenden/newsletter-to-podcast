import { NextResponse } from "next/server";
import { readMeta, readScript, episodeExists } from "@/lib/storage";

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

    const meta = await readMeta(id);
    const script = await readScript(id);

    return NextResponse.json({ ...meta, script });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
