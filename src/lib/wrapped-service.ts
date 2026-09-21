import { db } from "@/db";
import { listeningHistory, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { computeStats, peakHour } from "./analytics";
import { rowToEvent } from "./data-service";
import { getZonedDateParts } from "./timezone";
import { describeVibe } from "./vibe";

export { describeVibe } from "./vibe";

export interface WrappedData {
  timePeriod: string;
  totalPlays: number;
  /** Sum of known durations, in minutes. A lower bound if `playsWithoutDuration` > 0. */
  totalMinutes: number;
  playsWithoutDuration: number;
  topArtists: { name: string; count: number }[];
  topTracks: { name: string; artist: string; count: number }[];
  listeningVibe: string;
  uniqueArtists: number;
  /** Which sources contributed – lets the UI say "based on imported + Spotify data". */
  sources: string[];
  /** True if any Apple Music rows are included (their timestamps are estimates). */
  containsEstimatedTimestamps: boolean;
  estimatedTimestampCount: number;
  verifiedTimestampCount: number;
  timezone: string;
}

/** A recap needs at least this many plays to be meaningful. */
export const MIN_PLAYS_FOR_RECAP = 10;

/**
 * Build the yearly recap for one user. Calendar years are evaluated in the user's
 * timezone, rather than in the server's timezone.
 */
export async function generateWrappedData(userId: string, year: number): Promise<WrappedData | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;

  // Query this user's rows first, then apply the calendar-year boundary in the IANA
  // timezone. This avoids hand-rolling DST-aware UTC boundary arithmetic.
  const rows = await db.query.listeningHistory.findMany({
    where: eq(listeningHistory.userId, userId),
  });
  const events = rows
    .map(rowToEvent)
    .filter((event) => getZonedDateParts(event.playedAt, user.timezone).year === year);

  if (events.length < MIN_PLAYS_FOR_RECAP) return null;

  const stats = computeStats(events, 5, user.timezone);
  const sources = [...new Set(events.map((e) => e.provider))].sort();

  return {
    timePeriod: String(year),
    totalPlays: stats.totalPlays,
    totalMinutes: stats.totalMinutes,
    playsWithoutDuration: stats.playsWithoutDuration,
    topArtists: stats.topArtists,
    topTracks: stats.topTracks,
    listeningVibe: describeVibe(peakHour(stats.hourlyActivity)),
    uniqueArtists: stats.uniqueArtists,
    sources,
    containsEstimatedTimestamps: stats.estimatedTimestampCount > 0,
    estimatedTimestampCount: stats.estimatedTimestampCount,
    verifiedTimestampCount: stats.verifiedTimestampCount,
    timezone: user.timezone,
  };
}
