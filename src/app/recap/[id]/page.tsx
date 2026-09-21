import { getRecapForViewer } from "@/app/actions/recaps";
import WrappedStory from "@/app/dashboard/wrapped/WrappedStory";
import { notFound } from "next/navigation";
import type { WrappedData } from "@/lib/wrapped-service";
import type { Metadata } from "next";
import { recapOgPayload } from "@/lib/og-recap";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const viewed = await getRecapForViewer(id);
  if (!viewed) return { title: "Recap Not Found | Vinyl", robots: { index: false, follow: false } };

  const payload = recapOgPayload(viewed.recap.title, viewed.recap.data);
  const description = payload
    ? `${payload.plays.toLocaleString()} plays across ${payload.uniqueArtists} artists. A ${viewed.recap.title} listening recap on Vinyl.`
    : `${viewed.recap.title} on Vinyl.`;

  const robots = viewed.recap.isPublic
    ? { index: true, follow: true }
    : { index: false, follow: false };

  return {
    title: `${viewed.recap.title} | Vinyl Recap`,
    description,
    robots,
    openGraph: viewed.recap.isPublic
      ? {
          title: `${viewed.recap.title} | Vinyl Recap`,
          description,
          images: [{ url: absoluteUrl(`/api/og/recap/${id}`), width: 1200, height: 630, alt: viewed.recap.title }],
          type: "website",
        }
      : undefined,
    twitter: viewed.recap.isPublic
      ? {
          card: "summary_large_image",
          title: viewed.recap.title,
          description,
          images: [absoluteUrl(`/api/og/recap/${id}`)],
        }
      : undefined,
  };
}

export default async function PublicRecapPage({ params }: Props) {
  const { id } = await params;
  const viewed = await getRecapForViewer(id);

  if (!viewed) notFound();

  const exitHref = viewed.isOwner
    ? "/dashboard"
    : viewed.owner.profilePublic && viewed.owner.handle
      ? `/u/${viewed.owner.handle}`
      : "/";

  return (
    <main className="min-h-screen bg-background">
      <WrappedStory
        data={viewed.recap.data as unknown as WrappedData}
        initialId={viewed.recap.id}
        initialIsPublic={viewed.recap.isPublic}
        mode={viewed.isOwner ? "editor" : "viewer"}
        exitHref={exitHref}
        owner={viewed.owner}
      />
    </main>
  );
}
