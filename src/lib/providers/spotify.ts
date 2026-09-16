import { buildExternalId, type NewListeningRow } from "../listening";

export interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string; height: number; width: number }[];
    };
    duration_ms: number;
  };
  played_at: string;
}

export async function getRecentlyPlayed(accessToken: string, limit = 50) {
  const url = `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch Spotify tracks");
  }

  const data = await response.json();
  return data.items as SpotifyTrack[];
}

export function normalizeSpotifyTrack(item: SpotifyTrack, userId: string): NewListeningRow {
  const track = item.track;
  // Spotify lists the primary artist first; we keep only that one so an artist's
  // play count is not split across every "feat." combination.
  const artistName = track.artists[0]?.name ?? "Unknown Artist";
  const albumArt = track.album.images[0]?.url || null;

  return {
    userId,
    provider: "spotify",
    trackName: track.name,
    artistName,
    albumName: track.album.name,
    albumArtUrl: albumArt,
    playedAt: new Date(item.played_at),
    durationMs: track.duration_ms,
    externalId: buildExternalId("spotify", [item.played_at, track.id]),
    metadata: {
      trackId: track.id,
      allArtists: track.artists.map((a) => a.name),
    },
  };
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  /** Lifetime in SECONDS from now (Spotify never returns an absolute `expires_at`). */
  expires_in: number;
  refresh_token?: string;
}

export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials missing");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Spotify token");
  }

  return (await response.json()) as SpotifyTokenResponse;
}
