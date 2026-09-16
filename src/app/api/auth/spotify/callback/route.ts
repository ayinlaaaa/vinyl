import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { musicProviders } from "@/db/schema";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { eq, and } from "drizzle-orm";
import { SPOTIFY_STATE_COOKIE } from "@/lib/providers/spotify-oauth";
import type { SpotifyTokenResponse } from "@/lib/providers/spotify";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get(SPOTIFY_STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=spotify_state_mismatch", req.url));
  }

  if (error) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=spotify_access_denied", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/settings", req.url));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=spotify_not_configured", req.url));
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange Spotify code for tokens");
    }

    const tokens = (await response.json()) as SpotifyTokenResponse;
    const user = await getOrCreateDefaultUser();

    // Get Spotify user profile to get their ID
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
      throw new Error("Failed to load Spotify profile");
    }
    const profile = (await profileRes.json()) as { id: string };

    const existing = await db.query.musicProviders.findFirst({
      where: and(
        eq(musicProviders.userId, user.id),
        eq(musicProviders.provider, "spotify")
      ),
    });

    const values = {
      userId: user.id,
      provider: "spotify" as const,
      providerUserId: profile.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      isConnected: true,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(musicProviders).set(values).where(eq(musicProviders.id, existing.id));
    } else {
      await db.insert(musicProviders).values(values);
    }

    const res = NextResponse.redirect(new URL("/dashboard/settings?success=spotify_connected", req.url));
    res.cookies.delete(SPOTIFY_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("Spotify callback error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?error=spotify_callback_failed", req.url));
  }
}
