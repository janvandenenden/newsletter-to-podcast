import type { EpisodeStatus } from "@/types/episode";

const STATUS_CONFIG: Record<
  EpisodeStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  summarizing: {
    label: "Summarizing",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  scripting: {
    label: "Writing Script",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  generating_audio: {
    label: "Generating Audio",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  complete: {
    label: "Complete",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

export default function StatusBadge({ status }: { status: EpisodeStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}
