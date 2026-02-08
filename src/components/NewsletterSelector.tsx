"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NewsletterMeta } from "@/types/newsletter";
import NewsletterCard from "./NewsletterCard";

export default function NewsletterSelector() {
  const [newsletters, setNewsletters] = useState<NewsletterMeta[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/newsletters");
      if (!res.ok) throw new Error("Failed to fetch newsletters");
      const data = await res.json();
      setNewsletters(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load newsletters"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterIds: Array.from(selected) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create episode");
      }

      const data = await res.json();
      router.push(`/episodes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-500 animate-pulse py-8">
        Loading newsletters...
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 space-y-2">
        <p className="text-lg">No newsletters yet</p>
        <p className="text-sm">
          Forward newsletters to your inbound email address, or use the{" "}
          <button
            onClick={() => router.push("/newsletters")}
            className="text-blue-600 hover:underline"
          >
            import page
          </button>{" "}
          to add them manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {selected.size > 0
            ? `${selected.size} newsletter${selected.size > 1 ? "s" : ""} selected`
            : "Select newsletters to include in the episode"}
        </p>
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {newsletters.map((nl) => (
          <NewsletterCard
            key={nl.id}
            newsletter={nl}
            selected={selected.has(nl.id)}
            onToggle={toggleSelection}
            selectable
          />
        ))}
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={selected.size === 0 || submitting}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting
          ? "Creating Episode..."
          : `Generate Episode from ${selected.size || ""} Newsletter${selected.size !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
