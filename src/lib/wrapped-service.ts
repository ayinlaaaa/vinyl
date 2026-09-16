import { db } from "@/db";
import { listeningHistory } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";

export interface WrappedData {
  timePeriod: string;
  totalPlays: number;
  totalMinutes: number;
  topArtists: { name: string; count: number; image?: string }[];
  topTracks: { name: string; artist: string; count: number; image?: string }[];
  listeningVibe: string; // e.g., "Late Night Listener", "Morning Energizer"
  uniqueArtists: number;
}

export async function generateWrappedData(userId: string, year: number): Promise<WrappedData> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const history = await db.query.listeningHistory.findMany({
    where: and(
      eq(listeningHistory.userId, userId),
      gte(listeningHistory.playedAt, startDate),
      lte(listeningHistory.playedAt, endDate)
    )
  });

  if (history.length === 0) {
     throw new Error("Not enough data to generate a recap for this period.");
  }

  // Calculate stats
  const totalPlays = history.length;
  const totalMinutes = Math.round(history.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / (1000 * 60));

  const artistMap = new Map<string, { count: number; image?: string }>();
  const trackMap = new Map<string, { count: number; artist: string; image?: string }>();
  const hourMap = new Map<number, number>();

  history.forEach(item => {
    // Artist stats
    const artist = artistMap.get(item.artistName) || { count: 0, image: item.albumArtUrl || undefined };
    artist.count++;
    artistMap.set(item.artistName, artist);

    // Track stats
    const trackKey = `${item.trackName} - ${item.artistName}`;
    const track = trackMap.get(trackKey) || { count: 0, artist: item.artistName, image: item.albumArtUrl || undefined };
    track.count++;
    trackMap.set(trackKey, track);

    // Time of day
    const hour = item.playedAt.getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  const topArtists = Array.from(artistMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topTracks = Array.from(trackMap.entries())
    .map(([key, data]) => ({ name: key.split(" - ")[0], ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Determine Vibe
  const peakHour = Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0][0];
  let listeningVibe = "Balanced Listener";
  if (peakHour >= 22 || peakHour <= 4) listeningVibe = "Night Owl";
  else if (peakHour >= 5 && peakHour <= 9) listeningVibe = "Early Bird";
  else if (peakHour >= 14 && peakHour <= 17) listeningVibe = "Afternoon Connoisseur";

  return {
    timePeriod: year.toString(),
    totalPlays,
    totalMinutes,
    topArtists,
    topTracks,
    listeningVibe,
    uniqueArtists: artistMap.size,
  };
}
