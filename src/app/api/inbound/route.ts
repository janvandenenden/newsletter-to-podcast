import { NextResponse } from "next/server";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { parseInboundEmail, extractNewsletterContent } from "@/lib/emailParser";
import {
  createNewsletterDir,
  writeNewsletterMeta,
  writeNewsletterContent,
  writeNewsletterRawHtml,
} from "@/lib/newsletterStorage";
import type { NewsletterMeta } from "@/types/newsletter";

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if no secret configured (dev mode)
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature if configured
    const signature = request.headers.get("x-webhook-signature") ??
      request.headers.get("x-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const parsed = parseInboundEmail(payload);

    // Extract clean content from HTML, fall back to plain text
    let content: string;
    if (parsed.htmlBody) {
      content = extractNewsletterContent(parsed.htmlBody);
    } else if (parsed.textBody) {
      content = parsed.textBody.trim();
    } else {
      return NextResponse.json(
        { error: "Email has no content" },
        { status: 400 }
      );
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: "Email content too short to be a newsletter" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    await createNewsletterDir(id);

    const meta: NewsletterMeta = {
      id,
      sender: parsed.sender,
      subject: parsed.subject,
      receivedAt: new Date().toISOString(),
      contentPreview: content.slice(0, 200),
      contentLength: content.length,
      used: false,
      episodeIds: [],
    };

    await writeNewsletterMeta(id, meta);
    await writeNewsletterContent(id, content);

    if (parsed.htmlBody) {
      await writeNewsletterRawHtml(id, parsed.htmlBody);
    }

    return NextResponse.json({ id, subject: meta.subject }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
