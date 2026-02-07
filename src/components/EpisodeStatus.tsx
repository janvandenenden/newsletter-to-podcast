"use client";

import { useEffect, useState } from "react";
import type { EpisodeMeta, DialogueScript } from "@/types/episode";
import AudioPlayer from "./AudioPlayer";
import ScriptViewer from "./ScriptViewer";
import StatusBadge from "./StatusBadge";

interface EpisodeData extends EpisodeMeta {
  script?: DialogueScript | null;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  processing: "Starting up...",
  summarizing: "Analyzing newsletter...",
  scripting: "Writing dialogue script...",
  generating_audio: "Generating audio...",
};

export default function EpisodeStatusView({
  episodeId,
}: {
  episodeId: string;
}) {
  const [data, setData] = useState<EpisodeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/episodes/${episodeId}`);
        if (!res.ok) throw new Error("Failed to fetch episode");
        const episode: EpisodeData = await res.json();
        if (active) {
          setData(episode);
          if (episode.status !== "complete" && episode.status !== "error") {
            timer = setTimeout(poll, 2000);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load episode"
          );
        }
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [episodeId]);

  if (error) {
    return (
      <div className="text-red-500 bg-red-50 dark:bg-red-950 rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 animate-pulse">Loading episode...</div>
    );
  }

  const isProcessing =
    data.status !== "complete" && data.status !== "error";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <StatusBadge status={data.status} />
        </div>
        <div className="text-sm text-gray-500 flex gap-4">
          <span>{new Date(data.createdAt).toLocaleDateString()}</span>
          {data.duration && <span>{formatDuration(data.duration)}</span>}
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="space-y-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm font-medium">
            {STATUS_LABELS[data.status] || "Processing..."}
          </div>
          {data.status === "generating_audio" &&
            data.totalSegments &&
            data.currentSegment !== undefined && (
              <>
                <ProgressBar
                  current={data.currentSegment}
                  total={data.totalSegments}
                />
                <div className="text-xs text-gray-500">
                  Segment {data.currentSegment} of {data.totalSegments}
                </div>
              </>
            )}
        </div>
      )}

      {/* Error state */}
      {data.status === "error" && (
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 space-y-2">
          <div className="text-red-600 dark:text-red-400 text-sm font-medium">
            Something went wrong
          </div>
          <div className="text-red-500 text-sm">{data.error}</div>
        </div>
      )}

      {/* Audio Player */}
      {data.status === "complete" && (
        <AudioPlayer episodeId={episodeId} />
      )}

      {/* Script */}
      {data.script && <ScriptViewer script={data.script} />}
    </div>
  );
}
