"use server";

import { db } from "@/db";
import { musicProviders } from "@/db/schema";
import { insertListeningRows } from "@/lib/history-repo";
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

    // See normalizeAppleTrack: Apple gives no timestamps, so each track is recorded at
    // most once per day with an estimated playedAt. This is NOT a real play log.
    const syncedAt = new Date();
    const count = await insertListeningRows(tracks.map((t) => normalizeAppleTrack(t, user.id, syncedAt)));

    await db.update(musicProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count };
  } catch (error) {
    console.error("Apple Music sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return { success: false, error: `Apple Music sync failed: ${message}` };
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
