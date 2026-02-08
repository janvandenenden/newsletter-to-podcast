"use client";

import type { NewsletterMeta } from "@/types/newsletter";

interface NewsletterCardProps {
  newsletter: NewsletterMeta;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectable?: boolean;
}

export default function NewsletterCard({
  newsletter,
  selected = false,
  onToggle,
  onDelete,
  selectable = false,
}: NewsletterCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-gray-200 dark:border-gray-800"
      } ${selectable ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" : ""}`}
      onClick={selectable && onToggle ? () => onToggle(newsletter.id) : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle?.(newsletter.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="space-y-1 min-w-0">
            <h3 className="font-medium truncate">{newsletter.subject}</h3>
            <div className="text-xs text-gray-500 flex gap-3">
              <span>{newsletter.sender}</span>
              <span>{new Date(newsletter.receivedAt).toLocaleDateString()}</span>
              <span>
                {newsletter.contentLength.toLocaleString()} chars
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">
              {newsletter.contentPreview}
            </p>
            {newsletter.used && (
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Used in episode
              </span>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(newsletter.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors text-sm px-2 py-1"
            title="Delete newsletter"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
