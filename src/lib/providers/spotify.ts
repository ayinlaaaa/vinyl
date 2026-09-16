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

export function normalizeSpotifyTrack(item: SpotifyTrack) {
  const track = item.track;
  const artistNames = track.artists.map(a => a.name).join(", ");
  const albumArt = track.album.images[0]?.url || null;
  
  return {
    trackName: track.name,
    artistName: artistNames,
    albumName: track.album.name,
    albumArtUrl: albumArt,
    playedAt: new Date(item.played_at),
    durationMs: track.duration_ms,
    externalId: `spotify-${item.played_at}-${track.id}`.toLowerCase(),
    metadata: {
      provider: "spotify",
      trackId: track.id,
    }
  };
}

export async function refreshSpotifyToken(refreshToken: string) {
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

  return await response.json();
}
