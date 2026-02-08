import EpisodeCreator from "@/components/EpisodeCreator";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a New Episode</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select newsletters or paste text to generate a two-host podcast
          episode.
        </p>
      </div>
      <EpisodeCreator />
    </div>
  );
}
