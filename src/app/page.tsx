import EpisodeForm from "@/components/EpisodeForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a New Episode</h1>
        <p className="text-gray-500 text-sm mt-1">
          Paste newsletter text and we&apos;ll turn it into a two-host podcast
          episode.
        </p>
      </div>
      <EpisodeForm />
    </div>
  );
}
