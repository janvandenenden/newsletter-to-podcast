import { NextResponse } from "next/server";
import { listNewsletters } from "@/lib/newsletterStorage";

export async function GET() {
  try {
    const newsletters = await listNewsletters();
    return NextResponse.json(newsletters);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
