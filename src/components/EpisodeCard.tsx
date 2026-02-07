import Link from "next/link";
import type { EpisodeMeta } from "@/types/episode";
import StatusBadge from "./StatusBadge";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function EpisodeCard({ episode }: { episode: EpisodeMeta }) {
  return (
    <Link
      href={`/episodes/${episode.id}`}
      className="block border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3 className="font-medium truncate">{episode.title}</h3>
          <div className="text-xs text-gray-500 flex gap-3">
            <span>{new Date(episode.createdAt).toLocaleDateString()}</span>
            {episode.duration && (
              <span>{formatDuration(episode.duration)}</span>
            )}
            {episode.segmentCount && (
              <span>{episode.segmentCount} segments</span>
            )}
          </div>
          {episode.sourceTextPreview && (
            <p className="text-xs text-gray-400 truncate">
              {episode.sourceTextPreview}
            </p>
          )}
        </div>
        <StatusBadge status={episode.status} />
      </div>
    </Link>
  );
}
