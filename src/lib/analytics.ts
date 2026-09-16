import { format } from "date-fns";
import type { ListeningEvent } from "./listening";

export interface ArtistCount {
  name: string;
  count: number;
}

export interface TrackCount {
  name: string;
  artist: string;
  count: number;
}

export interface ListeningStats {
  totalPlays: number;
  /** Sum of known durations, in whole minutes. */
  totalMinutes: number;
  /** How many plays had no duration information. If > 0, `totalMinutes` is a lower bound. */
  playsWithoutDuration: number;
  uniqueArtists: number;
  uniqueTracks: number;
  topArtists: ArtistCount[];
  topTracks: TrackCount[];
  /** Plays per weekday, Monday first. */
  weekdayActivity: { name: string; count: number }[];
  /** Plays per hour of day (0–23). Hours are in the server's timezone – see docs/PROJECT_STATUS.md. */
  hourlyActivity: number[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Separator that cannot appear in real titles, so "Song - Remix" is never split wrongly. */
const KEY_SEP = "\u0000";

export function computeStats(events: ListeningEvent[], topN = 5): ListeningStats {
  const artistMap = new Map<string, number>();
  const trackMap = new Map<string, TrackCount>();
  const weekdayMap = new Map<string, number>();
  const hourly = new Array<number>(24).fill(0);

  let totalMs = 0;
  let playsWithoutDuration = 0;

  for (const e of events) {
    artistMap.set(e.artistName, (artistMap.get(e.artistName) ?? 0) + 1);

    const key = `${e.trackName}${KEY_SEP}${e.artistName}`;
    const t = trackMap.get(key);
    if (t) t.count++;
    else trackMap.set(key, { name: e.trackName, artist: e.artistName, count: 1 });

    const day = format(e.playedAt, "EEE");
    weekdayMap.set(day, (weekdayMap.get(day) ?? 0) + 1);
    hourly[e.playedAt.getHours()]++;

    if (e.durationMs === null) playsWithoutDuration++;
    else totalMs += e.durationMs;
  }

  return {
    totalPlays: events.length,
    totalMinutes: Math.round(totalMs / 60_000),
    playsWithoutDuration,
    uniqueArtists: artistMap.size,
    uniqueTracks: trackMap.size,
    topArtists: [...artistMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, topN),
    topTracks: [...trackMap.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, topN),
    weekdayActivity: WEEKDAYS.map((name) => ({ name, count: weekdayMap.get(name) ?? 0 })),
    hourlyActivity: hourly,
  };
}

/** Peak listening hour (0–23), or `null` if there are no plays. */
export function peakHour(hourly: number[]): number | null {
  if (hourly.every((n) => n === 0)) return null;
  return hourly.indexOf(Math.max(...hourly));
}

/** Format minutes as "12h 34m" / "45m" for display. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
