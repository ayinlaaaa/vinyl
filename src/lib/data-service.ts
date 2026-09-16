import { db } from "@/db";
import { listeningHistory, recaps } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { generateMockHistory, getStats, ListeningEvent } from "./mock-data";
import { format } from "date-fns";
import { getOrCreateDefaultUser } from "./db-utils";

export async function getDashboardData() {
  const dbEvents = await db.query.listeningHistory.findMany({
    orderBy: [desc(listeningHistory.playedAt)],
    limit: 500,
  });

  if (dbEvents.length === 0) {
    const mock = generateMockHistory(7);
    return {
      stats: getStats(mock),
      recent: mock.slice(0, 4),
      isMock: true
    };
  }

  // Convert DB events to the expected ListeningEvent format
  const events: ListeningEvent[] = dbEvents.map(e => ({
    id: e.id,
    trackName: e.trackName,
    artistName: e.artistName,
    albumName: e.albumName || "Unknown Album",
    playedAt: e.playedAt,
    durationMs: e.durationMs || 0,
  }));

  return {
    stats: getStats(events),
    recent: events.slice(0, 4),
    isMock: false
  };
}

export async function getHistoryData() {
  const dbEvents = await db.query.listeningHistory.findMany({
    orderBy: [desc(listeningHistory.playedAt)],
    limit: 100,
  });

  if (dbEvents.length === 0) {
    return { events: generateMockHistory(14), isMock: true };
  }

  return {
    events: dbEvents.map(e => ({
      id: e.id,
      trackName: e.trackName,
      artistName: e.artistName,
      albumName: e.albumName || "Unknown Album",
      playedAt: e.playedAt,
      durationMs: e.durationMs || 0,
    })),
    isMock: false
  };
}

export async function getCollectionData() {
  const dbEvents = await db.query.listeningHistory.findMany();

  if (dbEvents.length === 0) {
    const mock = generateMockHistory(90);
    const artistMap = new Map<string, number>();
    mock.forEach(e => artistMap.set(e.artistName, (artistMap.get(e.artistName) || 0) + 1));
    return {
      artists: Array.from(artistMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a,b) => b.count - a.count),
      isMock: true
    };
  }

  const artistMap = new Map<string, number>();
  dbEvents.forEach(e => artistMap.set(e.artistName, (artistMap.get(e.artistName) || 0) + 1));
  
  return {
    artists: Array.from(artistMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count),
    isMock: false
  };
}

export async function getRecapsData() {
  const user = await getOrCreateDefaultUser();
  const dbRecaps = await db.query.recaps.findMany({
    where: eq(recaps.userId, user.id),
    orderBy: [desc(recaps.createdAt)],
  });

  return dbRecaps;
}
