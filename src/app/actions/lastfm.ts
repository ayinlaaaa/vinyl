"use server";

import { db } from "@/db";
import { musicProviders } from "@/db/schema";
import { insertListeningRows } from "@/lib/history-repo";
import { requireUser } from "@/lib/auth/current-user";
import { fetchRecentTracks, normalizeLastfmTrack } from "@/lib/providers/lastfm";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function connectLastfm(username: string) {
  try {
    const user = await requireUser();
    const apiKey = process.env.LASTFM_API_KEY;

    if (!apiKey) {
      return { success: false, error: "LASTFM_API_KEY is not configured on the server." };
    }

    // Verify username by trying to fetch recent tracks
    try {
      await fetchRecentTracks(username, apiKey, 1);
    } catch (e) {
      return { success: false, error: "Could not find Last.fm user. Please check the username." };
    }

    // Save or update provider
    const existing = await db.query.musicProviders.findFirst({
      where: and(
        eq(musicProviders.userId, user.id),
        eq(musicProviders.provider, "lastfm")
      ),
    });

    if (existing) {
      await db.update(musicProviders)
        .set({ 
          providerUserId: username, 
          isConnected: true, 
          updatedAt: new Date() 
        })
        .where(eq(musicProviders.id, existing.id));
    } else {
      await db.insert(musicProviders).values({
        userId: user.id,
        provider: "lastfm",
        providerUserId: username,
        isConnected: true,
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Last.fm connect error:", error);
    return { success: false, error: "Failed to connect Last.fm" };
  }
}

export async function syncLastfm() {
  try {
    const user = await requireUser();
    const apiKey = process.env.LASTFM_API_KEY;

    if (!apiKey) return { success: false, error: "Last.fm API key missing" };

    const provider = await db.query.musicProviders.findFirst({
      where: and(
        eq(musicProviders.userId, user.id),
        eq(musicProviders.provider, "lastfm"),
        eq(musicProviders.isConnected, true)
      ),
    });

    if (!provider) return { success: false, error: "Last.fm not connected" };

    // Last.fm's recent-tracks endpoint is paginated; for now we fetch the latest 200.
    const tracks = await fetchRecentTracks(provider.providerUserId, apiKey, 200);
    const rows = tracks
      // Skip the "now playing" entry – it has no timestamp yet and will appear on the next sync.
      .filter((t): t is typeof t & { date: { uts: string } } => Boolean(t.date?.uts))
      .map((t) => normalizeLastfmTrack(t, user.id));

    const count = await insertListeningRows(rows);

    await db.update(musicProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count };
  } catch (error) {
    console.error("Last.fm sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return { success: false, error: `Last.fm sync failed: ${message}` };
  }
}

export async function disconnectLastfm() {
  const user = await requireUser();
  await db.update(musicProviders)
    .set({ isConnected: false })
    .where(and(
      eq(musicProviders.userId, user.id),
      eq(musicProviders.provider, "lastfm")
    ));
  revalidatePath("/dashboard/settings");
  return { success: true };
}
