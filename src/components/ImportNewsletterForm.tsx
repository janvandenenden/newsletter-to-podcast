"use client";

import { useState } from "react";

export default function ImportNewsletterForm({
  onImported,
}: {
  onImported?: () => void;
}) {
  const [mode, setMode] = useState<"text" | "html">("text");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const body: Record<string, string> = {};
      if (mode === "html") {
        body.html = content;
      } else {
        body.text = content;
      }
      if (subject) body.subject = subject;
      if (sender) body.sender = sender;

      const res = await fetch("/api/newsletters/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import newsletter");
      }

      setSuccess(true);
      setContent("");
      setSubject("");
      setSender("");
      onImported?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            mode === "text"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          Plain Text
        </button>
        <button
          type="button"
          onClick={() => setMode("html")}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            mode === "html"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          HTML
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Subject (optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Newsletter subject line"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Sender (optional)
          </label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="sender@example.com"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {mode === "html" ? "Paste newsletter HTML" : "Paste newsletter text"}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === "html"
              ? "Paste the raw HTML source of the newsletter email..."
              : "Paste the newsletter text content..."
          }
          rows={12}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm bg-green-50 dark:bg-green-950 rounded-lg px-4 py-2">
          Newsletter imported successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || content.trim().length === 0}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Importing..." : "Import Newsletter"}
      </button>
    </form>
  );
}
