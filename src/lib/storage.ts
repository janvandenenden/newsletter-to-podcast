import fs from "fs/promises";
import path from "path";
import { EPISODES_DIR } from "./constants";
import type { EpisodeMeta, DialogueScript } from "@/types/episode";

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export function episodeDir(id: string): string {
  return path.join(EPISODES_DIR, id);
}

export function metaPath(id: string): string {
  return path.join(episodeDir(id), "meta.json");
}

export function scriptPath(id: string): string {
  return path.join(episodeDir(id), "script.json");
}

export function segmentsDir(id: string): string {
  return path.join(episodeDir(id), "segments");
}

export function episodeAudioPath(id: string): string {
  return path.join(episodeDir(id), "episode.mp3");
}

export async function createEpisodeDir(id: string): Promise<void> {
  await ensureDir(episodeDir(id));
  await ensureDir(segmentsDir(id));
}

export async function writeMeta(
  id: string,
  meta: EpisodeMeta
): Promise<void> {
  await fs.writeFile(metaPath(id), JSON.stringify(meta, null, 2));
}

export async function readMeta(id: string): Promise<EpisodeMeta> {
  const raw = await fs.readFile(metaPath(id), "utf-8");
  return JSON.parse(raw);
}

export async function updateMeta(
  id: string,
  updates: Partial<EpisodeMeta>
): Promise<EpisodeMeta> {
  const meta = await readMeta(id);
  const updated = { ...meta, ...updates };
  await writeMeta(id, updated);
  return updated;
}

export async function writeScript(
  id: string,
  script: DialogueScript
): Promise<void> {
  await fs.writeFile(scriptPath(id), JSON.stringify(script, null, 2));
}

export async function readScript(id: string): Promise<DialogueScript | null> {
  try {
    const raw = await fs.readFile(scriptPath(id), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listEpisodes(): Promise<EpisodeMeta[]> {
  try {
    const dirs = await fs.readdir(EPISODES_DIR);
    const metas: EpisodeMeta[] = [];

    for (const dir of dirs) {
      try {
        const meta = await readMeta(dir);
        metas.push(meta);
      } catch {
        // skip invalid episode directories
      }
    }

    return metas.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function episodeExists(id: string): Promise<boolean> {
  try {
    await fs.access(metaPath(id));
    return true;
  } catch {
    return false;
  }
}
