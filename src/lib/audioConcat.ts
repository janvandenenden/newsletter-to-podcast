import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs/promises";
import path from "path";
import { segmentsDir, episodeAudioPath } from "./storage";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function concatenateSegments(episodeId: string): Promise<number> {
  const segsDir = segmentsDir(episodeId);
  const outputPath = episodeAudioPath(episodeId);

  const files = await fs.readdir(segsDir);
  const sortedFiles = files.filter((f) => f.endsWith(".mp3")).sort();

  if (sortedFiles.length === 0) {
    throw new Error("No audio segments found to concatenate");
  }

  // Write concat list file for ffmpeg
  const listContent = sortedFiles
    .map((f) => `file '${path.join(segsDir, f)}'`)
    .join("\n");
  const listPath = path.join(path.dirname(outputPath), "concat-list.txt");
  await fs.writeFile(listPath, listContent);

  // Concatenate using ffmpeg's concat demuxer (no re-encoding)
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });

  // Get duration via ffprobe
  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(outputPath, (err, data) => {
      if (err) return reject(err);
      resolve(data?.format?.duration || 0);
    });
  });

  return duration;
}
