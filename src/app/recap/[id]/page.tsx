import { getPublicRecap } from "@/app/actions/recaps";
import WrappedStory from "@/app/dashboard/wrapped/WrappedStory";
import { notFound } from "next/navigation";
import { WrappedData } from "@/lib/wrapped-service";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const recap = await getPublicRecap(params.id);
  if (!recap) return { title: "Recap Not Found" };

  const data = recap.data as unknown as WrappedData;
  return {
    title: `${recap.title} | Vinyl Recap`,
    description: `Check out my ${recap.title} music recap on Vinyl. Total ${data.totalMinutes.toLocaleString()} minutes listened!`,
    openGraph: {
      images: [
        {
          url: "/api/og/recap", // Hypothetical OG image endpoint
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function PublicRecapPage({ params }: { params: { id: string } }) {
  const recap = await getPublicRecap(params.id);

  if (!recap) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <WrappedStory data={recap.data as unknown as WrappedData} />
    </main>
  );
}
