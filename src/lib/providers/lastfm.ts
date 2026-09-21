import { buildExternalId, type NewListeningRow } from "../listening";
import { normalizeMusicPair } from "../music-normalizer";

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
    nowplaying?: string;
  };
}

export interface LastfmTracksPage {
  tracks: LastfmTrack[];
  page: number;
  totalPages: number;
  total: number;
}

export interface LastfmFetchOptions {
  page?: number;
  from?: number;
  limit?: number;
}

/** Fetch one page from Last.fm's paginated recent-tracks endpoint. */
export async function fetchRecentTracksPage(
  username: string,
  apiKey: string,
  options: LastfmFetchOptions = {},
): Promise<LastfmTracksPage> {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "user.getrecenttracks");
  url.searchParams.set("user", username);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 200, 200)));
  url.searchParams.set("page", String(options.page ?? 1));
  if (options.from !== undefined) url.searchParams.set("from", String(options.from));

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({})) as {
    error?: number;
    message?: string;
    recenttracks?: {
      track?: LastfmTrack | LastfmTrack[];
      "@attr"?: { page?: string; totalPages?: string; total?: string };
    };
  };
  // Last.fm returns HTTP 200 with an `error` code for unknown users, so check the body too.
  if (!response.ok || data.error) {
    throw new Error(data.message || "Failed to fetch from Last.fm");
  }

  const recent = data.recenttracks;
  const tracks = recent?.track;
  return {
    tracks: (Array.isArray(tracks) ? tracks : tracks ? [tracks] : []) as LastfmTrack[],
    page: Number(recent?.["@attr"]?.page ?? options.page ?? 1),
    totalPages: Number(recent?.["@attr"]?.totalPages ?? 1),
    total: Number(recent?.["@attr"]?.total ?? 0),
  };
}

/** Backwards-compatible convenience for callers that only need the first page. */
export async function fetchRecentTracks(username: string, apiKey: string, limit = 50) {
  const page = await fetchRecentTracksPage(username, apiKey, { limit });
  return page.tracks;
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
  const normalized = normalizeMusicPair(artistName, track.name);
  const albumArt = track.image?.find((img) => img.size === "large")?.["#text"] || null;
  const uts = parseInt(track.date.uts, 10);

  return {
    userId,
    provider: "lastfm",
    trackName: normalized.track.displayName,
    artistName: normalized.artist.displayName,
    albumName: track.album?.["#text"] || null,
    albumArtUrl: albumArt,
    playedAt: new Date(uts * 1000),
    durationMs: null,
    externalId: buildExternalId("lastfm", [uts, normalized.artist.canonicalKey, normalized.track.canonicalKey]),
    metadata: null,
    artistKey: normalized.artist.canonicalKey,
    trackKey: normalized.track.canonicalKey,
  };
}
