import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfileForViewer } from "@/lib/profile";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Disc, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const viewer = await getCurrentUser();
  const profile = await getProfileForViewer(handle, viewer?.id ?? null);
  if (!profile || profile.isOwnerPreview) {
    return { title: "Profile Not Found | Vinyl", robots: { index: false, follow: false } };
  }
  const title = `${profile.name || profile.handle} | Vinyl`;
  const description = `${profile.recaps.length} public recap${profile.recaps.length === 1 ? "" : "s"} on Vinyl.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const viewer = await getCurrentUser();
  const profile = await getProfileForViewer(handle, viewer?.id ?? null);
  if (!profile) notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 space-y-12">
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-vu">
              <Disc className="w-5 h-5" />
              <span className="text-sm font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
            </Link>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-vu">Listener archive</p>
            <h1 className="text-4xl md:text-6xl font-playfair font-bold">
              {profile.name || profile.handle}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">@{profile.handle}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              In the archive since {profile.createdAt.getFullYear()}
            </p>
          </div>
          {viewer && (
            <Link
              href="/dashboard"
              className="text-[10px] uppercase tracking-widest font-bold border border-border px-4 py-2 hover:bg-secondary"
            >
              Dashboard
            </Link>
          )}
        </header>

        {profile.isOwnerPreview && (
          <p className="border border-vu/30 bg-vu/5 p-4 text-sm text-vu">
            Preview only — this profile is private. Turn it public in Settings to let others find it.
          </p>
        )}

        <section className="space-y-6">
          <h2 className="text-2xl font-playfair font-bold">Public recaps</h2>
          {profile.recaps.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center space-y-3">
              <Globe className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground italic">No public recaps yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {profile.recaps.map((recap) => (
                <li key={recap.id}>
                  <Link
                    href={`/recap/${recap.id}`}
                    className="block p-6 md:p-8 border border-border bg-secondary/30 hover:border-vu/40 hover:bg-secondary/50 transition-colors"
                  >
                    <p className="text-[10px] uppercase tracking-widest font-bold text-vu mb-2">{recap.type}</p>
                    <h3 className="text-2xl font-playfair font-bold">{recap.title}</h3>
                    {recap.summary && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {recap.summary.minutes.toLocaleString()} minutes · {recap.summary.vibe}
                        {recap.summary.topArtist ? ` · ${recap.summary.topArtist}` : ""}
                      </p>
                    )}
                    <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Saved {recap.createdAt.toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
