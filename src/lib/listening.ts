/**
 * Shared vocabulary for a single listening event, independent of where it came from.
 * Every provider (Spotify, Last.fm, Apple, JSON import) is normalised into this shape
 * before it touches the database or the analytics code.
 */

export type ListeningSource = "spotify" | "lastfm" | "apple" | "import" | "mock";

export interface ListeningEvent {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string | null;
  playedAt: Date;
  /** Milliseconds actually listened. `null` when the source does not report it (e.g. Last.fm). */
  durationMs: number | null;
  provider: ListeningSource;
  /** Canonical values are optional for legacy rows and mock events. */
  artistKey?: string;
  trackKey?: string;
  /** Apple Music has no play timestamp; its recorded time is an estimate. */
  timestampEstimated?: boolean;
}

/** The row shape we insert into `listening_history` (minus DB-generated columns). */
export interface NewListeningRow {
  userId: string;
  provider: ListeningSource;
  trackName: string;
  artistName: string;
  albumName: string | null;
  albumArtUrl: string | null;
  playedAt: Date;
  durationMs: number | null;
  externalId: string;
  metadata: Record<string, unknown> | null;
  artistKey: string;
  trackKey: string;
}

/**
 * Build a stable de-duplication key. Two events with the same key are considered the
 * same play. Lower-cased and whitespace-collapsed so "Radiohead " and "radiohead" match.
 */
export function buildExternalId(
  provider: ListeningSource,
  parts: Array<string | number | null | undefined>
): string {
  const cleaned = parts
    .map((p) => (p === null || p === undefined ? "" : String(p)))
    .map((p) => p.trim().replace(/\s+/g, " ").toLowerCase());
  return `${provider}:${cleaned.join("|")}`;
}

/**
 * Coerce a "duration" value from any source into an integer number of milliseconds,
 * or `null` if it is missing / not a finite non-negative number.
 * The DB column is `integer`, so floats (which Spotify exports contain) must be rounded.
 */
export function toDurationMs(value: unknown): number | null {
  if (typeof value === "string" && value.trim() !== "") value = Number(value);
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

/** Parse an ISO string / epoch number / Date into a valid Date, or `null`. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    // Heuristic: values below 1e12 are seconds (Last.fm style), otherwise milliseconds.
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Trim a free-text field; returns `null` for empty / non-string input. */
export function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t === "" ? null : t;
}
