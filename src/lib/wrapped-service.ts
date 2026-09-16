import { db } from "@/db";
import { listeningHistory } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { computeStats, peakHour } from "./analytics";
import { rowToEvent } from "./data-service";

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
}

/** A recap needs at least this many plays to be meaningful. */
export const MIN_PLAYS_FOR_RECAP = 10;

export function describeVibe(hour: number | null): string {
  if (hour === null) return "Balanced Listener";
  if (hour >= 22 || hour <= 4) return "Night Owl";
  if (hour >= 5 && hour <= 9) return "Early Bird";
  if (hour >= 14 && hour <= 17) return "Afternoon Connoisseur";
  return "Balanced Listener";
}

/**
 * Build the yearly recap for one user. Returns `null` when there is not enough data,
 * so callers can render an empty state instead of catching exceptions.
 */
export async function generateWrappedData(userId: string, year: number): Promise<WrappedData | null> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const rows = await db.query.listeningHistory.findMany({
    where: and(
      eq(listeningHistory.userId, userId),
      gte(listeningHistory.playedAt, start),
      lt(listeningHistory.playedAt, end)
    ),
  });

  if (rows.length < MIN_PLAYS_FOR_RECAP) return null;

  const events = rows.map(rowToEvent);
  const stats = computeStats(events, 5);
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
    containsEstimatedTimestamps: sources.includes("apple"),
  };
}
