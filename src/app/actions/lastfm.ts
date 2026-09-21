"use server";

import { db } from "@/db";
import { musicProviders } from "@/db/schema";
import { insertListeningRows } from "@/lib/history-repo";
import { requireUser } from "@/lib/auth/current-user";
import { fetchRecentTracks, fetchRecentTracksPage, normalizeLastfmTrack } from "@/lib/providers/lastfm";
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

    // Walk through Last.fm pages until the previous sync boundary. A first sync
    // backfills every page Last.fm reports; later syncs only fetch the new tail.
    const boundary = provider.lastSyncedAt
      ? Math.floor(provider.lastSyncedAt.getTime() / 1000)
      : undefined;
    const tracks: Awaited<ReturnType<typeof fetchRecentTracksPage>>["tracks"] = [];
    let page = 1;
    let newestTimestamp = boundary ?? 0;
    const maxPages = 1000;

    while (page <= maxPages) {
      const result = await fetchRecentTracksPage(provider.providerUserId, apiKey, {
        page,
        from: boundary === undefined ? undefined : Math.max(0, boundary - 1),
        limit: 200,
      });
      tracks.push(...result.tracks);

      const dated = result.tracks
        .map((track) => Number(track.date?.uts))
        .filter((timestamp) => Number.isFinite(timestamp));
      if (dated.length) newestTimestamp = Math.max(newestTimestamp, ...dated);

      const reachedBoundary = boundary !== undefined && dated.length > 0 && Math.min(...dated) <= boundary;
      if (reachedBoundary || page >= result.totalPages || result.tracks.length === 0) break;
      page++;
    }

    const rows = tracks
      // Skip now-playing and records already covered by the previous boundary.
      .filter((t): t is typeof t & { date: { uts: string } } => {
        const timestamp = t.date?.uts;
        return Boolean(timestamp) && (boundary === undefined || Number(timestamp) > boundary);
      })
      .map((t) => normalizeLastfmTrack(t, user.id));

    const count = await insertListeningRows(rows);

    await db.update(musicProviders)
      .set({ lastSyncedAt: newestTimestamp > 0 ? new Date(newestTimestamp * 1000) : new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count, pages: page };
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
