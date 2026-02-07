import Link from "next/link";
import { listEpisodes } from "@/lib/storage";
import EpisodeCard from "@/components/EpisodeCard";

export const dynamic = "force-dynamic";

export default async function EpisodesPage() {
  const episodes = await listEpisodes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Episodes</h1>
        <Link
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          New Episode
        </Link>
      </div>

      {episodes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No episodes yet</p>
          <p className="text-sm">
            Paste a newsletter on the{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              home page
            </Link>{" "}
            to create your first episode.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </div>
  );
}
