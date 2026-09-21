import { db } from "@/db";
import { listeningHistory, recaps } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateMockHistory } from "./mock-data";
import { computeStats } from "./analytics";
import { normalizeMusicName, normalizeMusicPair } from "./music-normalizer";
import type { ListeningEvent, ListeningSource } from "./listening";
import { requireUser } from "./auth/current-user";

type HistoryRow = typeof listeningHistory.$inferSelect;

/** Convert a DB row into the shared ListeningEvent shape. */
export function rowToEvent(row: HistoryRow): ListeningEvent {
  const normalized = normalizeMusicPair(row.artistName, row.trackName);
  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : null;

  return {
    id: row.id,
    trackName: row.trackName,
    artistName: row.artistName,
    albumName: row.albumName,
    playedAt: row.playedAt,
    durationMs: row.durationMs,
    provider: row.provider as ListeningSource,
    artistKey: row.artistKey || normalized.artist.canonicalKey,
    trackKey: row.trackKey || normalized.track.canonicalKey,
    timestampEstimated: metadata?.timestampEstimated === true || row.provider === "apple",
  };
}

async function loadUserEvents(userId: string, limit?: number): Promise<ListeningEvent[]> {
  const rows = await db.query.listeningHistory.findMany({
    where: eq(listeningHistory.userId, userId),
    orderBy: [desc(listeningHistory.playedAt)],
    ...(limit ? { limit } : {}),
  });
  return rows.map(rowToEvent);
}

export async function getDashboardData() {
  const user = await requireUser();
  const events = await loadUserEvents(user.id, 500);

  if (events.length === 0) {
    const mock = generateMockHistory(7);
    return { stats: computeStats(mock, 5, user.timezone), recent: mock.slice(0, 4), isMock: true };
  }

  return { stats: computeStats(events, 5, user.timezone), recent: events.slice(0, 4), isMock: false };
}

export async function getHistoryData() {
  const user = await requireUser();
  const events = await loadUserEvents(user.id, 100);

  if (events.length === 0) {
    return { events: generateMockHistory(14), isMock: true, timezone: user.timezone };
  }
  return { events, isMock: false, timezone: user.timezone };
}

export async function getCollectionData() {
  const user = await requireUser();
  const events = await loadUserEvents(user.id);
  const source = events.length === 0 ? generateMockHistory(90) : events;

  const artistMap = new Map<string, { name: string; count: number }>();
  for (const e of source) {
    const normalized = normalizeMusicName(e.artistName);
    const existing = artistMap.get(e.artistKey || normalized.canonicalKey);
    if (existing) existing.count++;
    else artistMap.set(e.artistKey || normalized.canonicalKey, { name: normalized.displayName, count: 1 });
  }

  return {
    artists: [...artistMap.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    isMock: events.length === 0,
  };
}

export async function getRecapsData() {
  const user = await requireUser();
  return db.query.recaps.findMany({
    where: eq(recaps.userId, user.id),
    orderBy: [desc(recaps.createdAt)],
  });
}
