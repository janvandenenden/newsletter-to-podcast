import fs from "fs/promises";
import path from "path";
import { NEWSLETTERS_DIR } from "./constants";
import type { NewsletterMeta } from "@/types/newsletter";

function newsletterDir(id: string): string {
  return path.join(NEWSLETTERS_DIR, id);
}

function metaPath(id: string): string {
  return path.join(newsletterDir(id), "meta.json");
}

function contentPath(id: string): string {
  return path.join(newsletterDir(id), "content.txt");
}

function rawHtmlPath(id: string): string {
  return path.join(newsletterDir(id), "raw.html");
}

export async function createNewsletterDir(id: string): Promise<void> {
  await fs.mkdir(newsletterDir(id), { recursive: true });
}

export async function writeNewsletterMeta(
  id: string,
  meta: NewsletterMeta
): Promise<void> {
  await fs.writeFile(metaPath(id), JSON.stringify(meta, null, 2));
}

export async function readNewsletterMeta(id: string): Promise<NewsletterMeta> {
  const raw = await fs.readFile(metaPath(id), "utf-8");
  return JSON.parse(raw);
}

export async function updateNewsletterMeta(
  id: string,
  updates: Partial<NewsletterMeta>
): Promise<NewsletterMeta> {
  const meta = await readNewsletterMeta(id);
  const updated = { ...meta, ...updates };
  await writeNewsletterMeta(id, updated);
  return updated;
}

export async function writeNewsletterContent(
  id: string,
  text: string
): Promise<void> {
  await fs.writeFile(contentPath(id), text);
}

export async function readNewsletterContent(id: string): Promise<string> {
  return fs.readFile(contentPath(id), "utf-8");
}

export async function writeNewsletterRawHtml(
  id: string,
  html: string
): Promise<void> {
  await fs.writeFile(rawHtmlPath(id), html);
}

export async function listNewsletters(): Promise<NewsletterMeta[]> {
  try {
    const dirs = await fs.readdir(NEWSLETTERS_DIR);
    const metas: NewsletterMeta[] = [];

    for (const dir of dirs) {
      try {
        const meta = await readNewsletterMeta(dir);
        metas.push(meta);
      } catch {
        // skip invalid directories
      }
    }

    return metas.sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function newsletterExists(id: string): Promise<boolean> {
  try {
    await fs.access(metaPath(id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteNewsletter(id: string): Promise<void> {
  await fs.rm(newsletterDir(id), { recursive: true, force: true });
}

export async function markNewsletterUsed(
  id: string,
  episodeId: string
): Promise<void> {
  const meta = await readNewsletterMeta(id);
  if (!meta.episodeIds.includes(episodeId)) {
    meta.episodeIds.push(episodeId);
  }
  meta.used = true;
  await writeNewsletterMeta(id, meta);
}

export async function getNewslettersByIds(
  ids: string[]
): Promise<NewsletterMeta[]> {
  const metas: NewsletterMeta[] = [];
  for (const id of ids) {
    metas.push(await readNewsletterMeta(id));
  }
  return metas;
}
