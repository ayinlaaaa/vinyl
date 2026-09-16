"use server";

import { db } from "@/db";
import { musicProviders } from "@/db/schema";
import { insertListeningRows } from "@/lib/history-repo";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { getRecentlyPlayed, normalizeSpotifyTrack, refreshSpotifyToken } from "@/lib/providers/spotify";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { SPOTIFY_STATE_COOKIE } from "@/lib/providers/spotify-oauth";

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

  // `state` is a random value we store in an httpOnly cookie and verify in the callback.
  // It stops an attacker from tricking a user into linking the attacker's Spotify account.
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(SPOTIFY_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("state", state);
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
          // Spotify may rotate the refresh token; keep the old one if it doesn't.
          refreshToken: tokens.refresh_token ?? provider.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(musicProviders.id, provider.id));
    }

    if (!accessToken) return { success: false, error: "Failed to obtain access token" };

    // Spotify only ever returns the 50 most recent plays – there is no way to page further back.
    const items = await getRecentlyPlayed(accessToken);
    const count = await insertListeningRows(items.map((item) => normalizeSpotifyTrack(item, user.id)));

    await db.update(musicProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(musicProviders.id, provider.id));

    revalidatePath("/dashboard");
    return { success: true, count };
  } catch (error) {
    console.error("Spotify sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return { success: false, error: `Spotify sync failed: ${message}` };
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
