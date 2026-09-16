import {
  buildExternalId,
  cleanText,
  toDate,
  toDurationMs,
  type NewListeningRow,
} from "./listening";

/**
 * Turns an arbitrary JSON array (uploaded by the user) into rows we can insert.
 *
 * Supported shapes, detected per record:
 *  1. VINYL's own simple format:            { trackName, artistName, albumName?, playedAt, durationMs? }
 *  2. Spotify "Extended Streaming History": { ts, master_metadata_track_name, master_metadata_album_artist_name,
 *                                             master_metadata_album_album_name, ms_played, spotify_track_uri }
 *  3. Spotify "Account Data" StreamingHistory: { endTime, artistName, trackName, msPlayed }
 *
 * This module is pure (no DB, no Next.js) so it can be unit-tested directly.
 */

export interface ImportRejection {
  index: number;
  reason: string;
}

export interface NormalizedImport {
  rows: NewListeningRow[];
  rejected: ImportRejection[];
  /** Rows dropped because another row in the same file had an identical externalId. */
  duplicatesInFile: number;
}

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Spotify's extended export includes podcast episodes and rows where the track name is
 * null (e.g. local files or deleted tracks). We skip those because they can't be
 * attributed to an artist and would show up as "Unknown".
 */
function normalizeOne(item: Rec, userId: string): NewListeningRow | string {
  const trackName =
    cleanText(item.trackName) ?? cleanText(item.master_metadata_track_name);
  const artistName =
    cleanText(item.artistName) ?? cleanText(item.master_metadata_album_artist_name);
  const albumName =
    cleanText(item.albumName) ?? cleanText(item.master_metadata_album_album_name);

  if (!trackName) return "missing track name";
  if (!artistName) return "missing artist name";

  const playedAt = toDate(item.playedAt ?? item.ts ?? item.endTime);
  if (!playedAt) return "missing or invalid timestamp";
  if (playedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) return "timestamp is in the future";

  const durationMs = toDurationMs(item.durationMs ?? item.ms_played ?? item.msPlayed);

  // Spotify gives a per-track URI – the most reliable identity when present.
  const spotifyUri = cleanText(item.spotify_track_uri);
  const externalId = spotifyUri
    ? buildExternalId("import", [playedAt.toISOString(), spotifyUri])
    : buildExternalId("import", [playedAt.toISOString(), artistName, trackName]);

  return {
    userId,
    provider: "import",
    trackName,
    artistName,
    albumName,
    albumArtUrl: null,
    playedAt,
    durationMs,
    externalId,
    metadata: spotifyUri ? { spotifyTrackUri: spotifyUri } : null,
  };
}

export function normalizeImport(data: unknown, userId: string): NormalizedImport {
  const list: unknown[] = Array.isArray(data) ? data : [data];
  const rows: NewListeningRow[] = [];
  const rejected: ImportRejection[] = [];
  const seen = new Set<string>();
  let duplicatesInFile = 0;

  list.forEach((item, index) => {
    if (!isRecord(item)) {
      rejected.push({ index, reason: "not an object" });
      return;
    }
    const result = normalizeOne(item, userId);
    if (typeof result === "string") {
      rejected.push({ index, reason: result });
      return;
    }
    if (seen.has(result.externalId)) {
      duplicatesInFile++;
      return;
    }
    seen.add(result.externalId);
    rows.push(result);
  });

  return { rows, rejected, duplicatesInFile };
}
