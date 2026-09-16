import { getPublicRecap } from "@/app/actions/recaps";
import WrappedStory from "@/app/dashboard/wrapped/WrappedStory";
import { notFound } from "next/navigation";
import type { WrappedData } from "@/lib/wrapped-service";
import type { Metadata } from "next";

// In Next.js 15+, dynamic route params arrive as a Promise and must be awaited.
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recap = await getPublicRecap(id);
  if (!recap) return { title: "Recap Not Found | Vinyl" };

  const data = recap.data as unknown as WrappedData;
  return {
    title: `${recap.title} | Vinyl Recap`,
    description: `${data.totalPlays.toLocaleString()} plays across ${data.uniqueArtists} artists. A ${recap.title} listening recap on Vinyl.`,
  };
}

export default async function PublicRecapPage({ params }: Props) {
  const { id } = await params;
  const recap = await getPublicRecap(id);

  if (!recap) notFound();

  return (
    <main className="min-h-screen bg-background">
      <WrappedStory data={recap.data as unknown as WrappedData} />
    </main>
  );
}
