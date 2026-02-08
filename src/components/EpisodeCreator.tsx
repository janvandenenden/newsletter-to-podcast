"use client";

import { useState } from "react";
import NewsletterSelector from "./NewsletterSelector";
import EpisodeForm from "./EpisodeForm";

type Tab = "newsletters" | "paste";

export default function EpisodeCreator() {
  const [tab, setTab] = useState<Tab>("newsletters");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab("newsletters")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "newsletters"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          From Newsletters
        </button>
        <button
          onClick={() => setTab("paste")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "paste"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Paste Text
        </button>
      </div>

      {tab === "newsletters" ? <NewsletterSelector /> : <EpisodeForm />}
    </div>
  );
}
