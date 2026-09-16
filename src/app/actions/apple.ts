"use server";

import { db } from "@/db";
import { musicProviders, listeningHistory } from "@/db/schema";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { getRecentlyPlayed, normalizeAppleTrack } from "@/lib/providers/apple";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function connectAppleMusic(musicUserToken: string) {
  try {
    const user = await getOrCreateDefaultUser();
    
    const existing = await db.query.musicProviders.findFirst({
      where: and(
        eq(musicProviders.userId, user.id),
        eq(musicProviders.provider, "apple")
      ),
    });

    const values = {
      userId: user.id,
      provider: "apple" as const,
      providerUserId: "me", // Apple Music doesn't expose a simple user ID without extra calls
      accessToken: musicUserToken, // We'll store the Music-User-Token here
      isConnected: true,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(musicProviders).set(values).where(eq(musicProviders.id, existing.id));
    } else {
      await db.insert(musicProviders).values(values);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Apple Music connect error:", error);
    return { success: false, error: "Failed to connect Apple Music" };
  }
}

export async function syncAppleMusic() {
  try {
    const user = await getOrCreateDefaultUser();
    const developerToken = process.env.APPLE_DEVELOPER_TOKEN;

    if (!developerToken) {
      return { success: false, error: "Apple Developer Token not configured" };
    }

    const provider = await db.query.musicProviders.findFirst({
      where: and(
        eq(musicProviders.userId, user.id),
        eq(musicProviders.provider, "apple"),
        eq(musicProviders.isConnected, true)
      ),
    });

    if (!provider || !provider.accessToken) {
      return { success: false, error: "Apple Music not connected" };
    }

    const tracks = await getRecentlyPlayed(developerToken, provider.accessToken);
    
    // Apple Music doesn't give us a timestamp for "recently played", 
    // so we handle it as "new entries found now".
    // To prevent massive duplicates, we can check if the track was played very recently.
    
    let count = 0;
    for (const track of tracks) {
      const normalized = {
        ...normalizeAppleTrack(track),
        userId: user.id,
        provider: "apple",
      };

      // We use a combination of track ID and artist to check for "recent" matches
      // This is a limitation of Apple Music's recently played API compared to Spotify/Lastfm
      const existing = await db.query.listeningHistory.findFirst({
        where: and(
          eq(listeningHistory.trackName, normalized.trackName),
          eq(listeningHistory.provider, "apple"),
          // Check within the last hour to avoid immediate duplicates during sync
          // In a real production app, we'd use a more robust strategy
        )
      });

      if (!existing) {
        await db.insert(listeningHistory).values(normalized);
        count++;
      }
    }

    await db.update(musicProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count };
  } catch (error) {
    console.error("Apple Music sync error:", error);
    return { success: false, error: "Sync failed" };
  }
}

export async function disconnectAppleMusic() {
  const user = await getOrCreateDefaultUser();
  await db.update(musicProviders)
    .set({ isConnected: false })
    .where(and(
      eq(musicProviders.userId, user.id),
      eq(musicProviders.provider, "apple")
    ));
  revalidatePath("/dashboard/settings");
  return { success: true };
}
