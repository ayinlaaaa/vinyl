import { db } from "@/db";
import { listeningHistory, recaps } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateMockHistory } from "./mock-data";
import { computeStats } from "./analytics";
import type { ListeningEvent, ListeningSource } from "./listening";
import { getOrCreateDefaultUser } from "./db-utils";

type HistoryRow = typeof listeningHistory.$inferSelect;

/** Convert a DB row into the shared ListeningEvent shape. */
export function rowToEvent(row: HistoryRow): ListeningEvent {
  return {
    id: row.id,
    trackName: row.trackName,
    artistName: row.artistName,
    albumName: row.albumName,
    playedAt: row.playedAt,
    durationMs: row.durationMs,
    provider: row.provider as ListeningSource,
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
  const user = await getOrCreateDefaultUser();
  const events = await loadUserEvents(user.id, 500);

  if (events.length === 0) {
    const mock = generateMockHistory(7);
    return { stats: computeStats(mock), recent: mock.slice(0, 4), isMock: true };
  }

  return { stats: computeStats(events), recent: events.slice(0, 4), isMock: false };
}

export async function getHistoryData() {
  const user = await getOrCreateDefaultUser();
  const events = await loadUserEvents(user.id, 100);

  if (events.length === 0) {
    return { events: generateMockHistory(14), isMock: true };
  }
  return { events, isMock: false };
}

export async function getCollectionData() {
  const user = await getOrCreateDefaultUser();
  const events = await loadUserEvents(user.id);
  const source = events.length === 0 ? generateMockHistory(90) : events;

  const artistMap = new Map<string, number>();
  for (const e of source) artistMap.set(e.artistName, (artistMap.get(e.artistName) ?? 0) + 1);

  return {
    artists: [...artistMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    isMock: events.length === 0,
  };
}

export async function getRecapsData() {
  const user = await getOrCreateDefaultUser();
  return db.query.recaps.findMany({
    where: eq(recaps.userId, user.id),
    orderBy: [desc(recaps.createdAt)],
  });
}
