import { buildExternalId, type NewListeningRow } from "../listening";

export interface LastfmTrack {
  name: string;
  artist: { "#text": string; name?: string } | string;
  album: {
    "#text": string;
  };
  image: {
    "#text": string;
    size: string;
  }[];
  date?: {
    uts: string;
    "#text": string;
  };
  "@attr"?: {
    nowplaying: string;
  };
}

export async function fetchRecentTracks(username: string, apiKey: string, limit = 50) {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "user.getrecenttracks");
  url.searchParams.set("user", username);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  // Last.fm returns HTTP 200 with an `error` code for unknown users, so check the body too.
  if (!response.ok || data.error) {
    throw new Error(data.message || "Failed to fetch from Last.fm");
  }

  const tracks = data.recenttracks?.track;
  // A single result comes back as an object, not an array.
  return (Array.isArray(tracks) ? tracks : tracks ? [tracks] : []) as LastfmTrack[];
}

/**
 * Only call this for tracks that have a `date` – "now playing" entries have none and
 * would otherwise be stored with a made-up timestamp.
 *
 * NOTE: Last.fm does not report track duration, so `durationMs` is always null.
 * Listening-time totals for Last.fm users are therefore a lower bound.
 */
export function normalizeLastfmTrack(track: LastfmTrack & { date: { uts: string } }, userId: string): NewListeningRow {
  const artistName = typeof track.artist === "string" ? track.artist : track.artist?.["#text"] || "Unknown Artist";
  const albumArt = track.image?.find((img) => img.size === "large")?.["#text"] || null;
  const uts = parseInt(track.date.uts, 10);

  return {
    userId,
    provider: "lastfm",
    trackName: track.name,
    artistName,
    albumName: track.album?.["#text"] || null,
    albumArtUrl: albumArt,
    playedAt: new Date(uts * 1000),
    durationMs: null,
    externalId: buildExternalId("lastfm", [uts, artistName, track.name]),
    metadata: null,
  };
}
