"use server";

import { db } from "@/db";
import { musicProviders, listeningHistory } from "@/db/schema";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { getRecentlyPlayed, normalizeSpotifyTrack, refreshSpotifyToken } from "@/lib/providers/spotify";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSpotifyAuthUrl() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return { success: false, error: "Spotify Client ID or Redirect URI not configured" };
  }

  const scopes = [
    "user-read-recently-played",
    "user-read-private",
    "user-read-email"
  ].join(" ");

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("scope", scopes);
  url.searchParams.append("show_dialog", "true");

  return { success: true, url: url.toString() };
}

export async function syncSpotify() {
  try {
    const user = await getOrCreateDefaultUser();
    const provider = await db.query.musicProviders.findFirst({
      where: and(
        eq(musicProviders.userId, user.id),
        eq(musicProviders.provider, "spotify"),
        eq(musicProviders.isConnected, true)
      ),
    });

    if (!provider) return { success: false, error: "Spotify not connected" };

    let accessToken = provider.accessToken;

    // Check if token needs refresh
    if (!accessToken || (provider.expiresAt && provider.expiresAt < new Date())) {
      if (!provider.refreshToken) return { success: false, error: "No refresh token available" };
      
      const tokens = await refreshSpotifyToken(provider.refreshToken);
      accessToken = tokens.access_token;
      
      await db.update(musicProviders)
        .set({
          accessToken: tokens.access_token,
          expiresAt: new Date(Date.now() + tokens.expires_at * 1000),
          updatedAt: new Date(),
        })
        .where(eq(musicProviders.id, provider.id));
    }

    if (!accessToken) return { success: false, error: "Failed to obtain access token" };

    const items = await getRecentlyPlayed(accessToken);
    const normalized = items.map(item => ({
      ...normalizeSpotifyTrack(item),
      userId: user.id,
      provider: "spotify",
    }));

    let count = 0;
    for (const track of normalized) {
      const existing = await db.query.listeningHistory.findFirst({
        where: eq(listeningHistory.externalId, track.externalId)
      });

      if (!existing) {
        await db.insert(listeningHistory).values(track);
        count++;
      }
    }

    await db.update(musicProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count };
  } catch (error) {
    console.error("Spotify sync error:", error);
    return { success: false, error: "Sync failed" };
  }
}

export async function disconnectSpotify() {
  const user = await getOrCreateDefaultUser();
  await db.update(musicProviders)
    .set({ isConnected: false })
    .where(and(
      eq(musicProviders.userId, user.id),
      eq(musicProviders.provider, "spotify")
    ));
  revalidatePath("/dashboard/settings");
  return { success: true };
}
