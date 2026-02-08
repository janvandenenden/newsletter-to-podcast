"use client";

import { useEffect, useState } from "react";
import type { NewsletterMeta } from "@/types/newsletter";
import NewsletterCard from "./NewsletterCard";
import ImportNewsletterForm from "./ImportNewsletterForm";

export default function NewsletterInbox() {
  const [newsletters, setNewsletters] = useState<NewsletterMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/newsletters");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNewsletters(data);
    } catch {
      // silently fail, show empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletters/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNewsletters((prev) => prev.filter((nl) => nl.id !== id));
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="text-gray-500 animate-pulse py-8">
        Loading newsletters...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newsletters</h1>
        <button
          onClick={() => setShowImport(!showImport)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showImport ? "Close" : "Import Newsletter"}
        </button>
      </div>

      {showImport && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3">Import a Newsletter</h2>
          <ImportNewsletterForm
            onImported={() => {
              setShowImport(false);
              fetchNewsletters();
            }}
          />
        </div>
      )}

      {newsletters.length === 0 && !showImport ? (
        <div className="text-center py-12 text-gray-500 space-y-3">
          <p className="text-lg">No newsletters yet</p>
          <p className="text-sm max-w-md mx-auto">
            Forward newsletters to your inbound email address to see them here.
            You can also import them manually using the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {newsletters.map((nl) => (
            <NewsletterCard
              key={nl.id}
              newsletter={nl}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
