import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { extractNewsletterContent } from "@/lib/emailParser";
import {
  createNewsletterDir,
  writeNewsletterMeta,
  writeNewsletterContent,
  writeNewsletterRawHtml,
} from "@/lib/newsletterStorage";
import type { NewsletterMeta } from "@/types/newsletter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { html, text, subject, sender } = body;

    if (!html && !text) {
      return NextResponse.json(
        { error: "Either html or text content is required" },
        { status: 400 }
      );
    }

    let content: string;
    if (html) {
      content = extractNewsletterContent(html);
    } else {
      content = text.trim();
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: "Content too short to be a newsletter" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    await createNewsletterDir(id);

    const meta: NewsletterMeta = {
      id,
      sender: sender || "Manual import",
      subject: subject || "Imported newsletter",
      receivedAt: new Date().toISOString(),
      contentPreview: content.slice(0, 200),
      contentLength: content.length,
      used: false,
      episodeIds: [],
    };

    await writeNewsletterMeta(id, meta);
    await writeNewsletterContent(id, content);

    if (html) {
      await writeNewsletterRawHtml(id, html);
    }

    return NextResponse.json(meta, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
