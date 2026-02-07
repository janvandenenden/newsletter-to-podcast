import EpisodeStatusView from "@/components/EpisodeStatus";

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EpisodeStatusView episodeId={id} />;
}
