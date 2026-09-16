"use server";

import { db } from "@/db";
import { musicProviders, listeningHistory } from "@/db/schema";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { fetchRecentTracks, normalizeLastfmTrack } from "@/lib/providers/lastfm";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function connectLastfm(username: string) {
  try {
    const user = await getOrCreateDefaultUser();
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
    const user = await getOrCreateDefaultUser();
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

    const tracks = await fetchRecentTracks(provider.providerUserId, apiKey, 100);
    const normalized = tracks
      .filter(t => t.date) // Skip "now playing" which has no date
      .map(t => ({
        ...normalizeLastfmTrack(t),
        userId: user.id,
        provider: "lastfm",
      }));

    let count = 0;
    for (const track of normalized) {
      try {
        // Check if already exists to avoid duplicates
        const existing = await db.query.listeningHistory.findFirst({
          where: eq(listeningHistory.externalId, track.externalId)
        });
        
        if (!existing) {
          await db.insert(listeningHistory).values(track);
          count++;
        }
      } catch (e) {
        // Continue on error
      }
    }

    await db.update(musicProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count };
  } catch (error) {
    console.error("Last.fm sync error:", error);
    return { success: false, error: "Sync failed" };
  }
}

export async function disconnectLastfm() {
  const user = await getOrCreateDefaultUser();
  await db.update(musicProviders)
    .set({ isConnected: false })
    .where(and(
      eq(musicProviders.userId, user.id),
      eq(musicProviders.provider, "lastfm")
    ));
  revalidatePath("/dashboard/settings");
  return { success: true };
}
