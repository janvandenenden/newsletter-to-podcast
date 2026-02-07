import type { DialogueScript } from "@/types/episode";

export default function ScriptViewer({ script }: { script: DialogueScript }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Script
      </h3>
      <div className="space-y-2">
        {script.segments.map((segment, i) => {
          const isHostA = segment.speaker === "hostA";
          return (
            <div
              key={i}
              className={`flex gap-3 ${isHostA ? "" : "flex-row-reverse"}`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  isHostA
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                }`}
              >
                {isHostA ? "A" : "S"}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  isHostA
                    ? "bg-blue-50 dark:bg-blue-950"
                    : "bg-purple-50 dark:bg-purple-950"
                }`}
              >
                <div className="text-xs font-medium mb-1 opacity-60">
                  {isHostA ? "Alex" : "Sam"}
                  {segment.topic && (
                    <span className="ml-2 opacity-50">({segment.topic})</span>
                  )}
                </div>
                {segment.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
