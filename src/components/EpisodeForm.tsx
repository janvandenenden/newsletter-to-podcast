"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_INPUT_LENGTH = 50_000;

export default function EpisodeForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create episode");
      }

      const data = await res.json();
      router.push(`/episodes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="newsletter-text"
          className="block text-sm font-medium mb-2"
        >
          Paste your newsletter text below
        </label>
        <textarea
          id="newsletter-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full text of a newsletter here..."
          rows={20}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          disabled={loading}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            {text.length > 0
              ? `${text.length.toLocaleString()} characters`
              : ""}
          </span>
          <span>{MAX_INPUT_LENGTH.toLocaleString()} max</span>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || text.trim().length === 0}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Creating Episode..." : "Generate Episode"}
      </button>
    </form>
  );
}
