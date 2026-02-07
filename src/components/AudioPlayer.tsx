"use client";

export default function AudioPlayer({ episodeId }: { episodeId: string }) {
  return (
    <div className="w-full">
      <audio
        controls
        className="w-full"
        src={`/api/episodes/${episodeId}/audio`}
        preload="metadata"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
