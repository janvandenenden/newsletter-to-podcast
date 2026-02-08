import { NextResponse } from "next/server";
import {
  readNewsletterMeta,
  readNewsletterContent,
  deleteNewsletter,
  newsletterExists,
} from "@/lib/newsletterStorage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!(await newsletterExists(id))) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      );
    }

    const meta = await readNewsletterMeta(id);
    const content = await readNewsletterContent(id);

    return NextResponse.json({ ...meta, content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!(await newsletterExists(id))) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      );
    }

    await deleteNewsletter(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
