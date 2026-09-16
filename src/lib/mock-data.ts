import { subDays, startOfDay, format, eachDayOfInterval } from "date-fns";

export interface ListeningEvent {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string;
  playedAt: Date;
  durationMs: number;
}

const ARTISTS = [
  { name: "Radiohead", tracks: ["Creep", "Paranoid Android", "Karma Police", "No Surprises"] },
  { name: "Kendrick Lamar", tracks: ["Humble", "Alright", "DNA.", "King Kunta"] },
  { name: "Daft Punk", tracks: ["Get Lucky", "One More Time", "Harder Better Faster Stronger"] },
  { name: "Tame Impala", tracks: ["The Less I Know The Better", "Let It Happen", "Borderline"] },
  { name: "Aphex Twin", tracks: ["Windowlicker", "Xtal", "Alberto Balsalm"] },
  { name: "FKA twigs", tracks: ["Cellophane", "Two Weeks", "Tears in the Club"] },
];

export function generateMockHistory(days = 30): ListeningEvent[] {
  const events: ListeningEvent[] = [];
  const now = new Date();

  for (let i = 0; i < days * 20; i++) {
    const artist = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
    const track = artist.tracks[Math.floor(Math.random() * artist.tracks.length)];
    const playedAt = subDays(now, Math.random() * days);
    
    events.push({
      id: Math.random().toString(36).substring(7),
      trackName: track,
      artistName: artist.name,
      albumName: "Essential " + artist.name,
      playedAt,
      durationMs: 180000 + Math.random() * 120000,
    });
  }

  return events.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
}

export function getStats(events: ListeningEvent[]) {
  const topArtists = new Map<string, number>();
  const topTracks = new Map<string, number>();
  const dailyActivity = new Map<string, number>();

  events.forEach(event => {
    topArtists.set(event.artistName, (topArtists.get(event.artistName) || 0) + 1);
    topTracks.set(`${event.trackName} - ${event.artistName}`, (topTracks.get(`${event.trackName} - ${event.artistName}`) || 0) + 1);
    
    const day = format(event.playedAt, "EEE");
    dailyActivity.set(day, (dailyActivity.get(day) || 0) + 1);
  });

  return {
    totalPlays: events.length,
    totalTime: Math.round(events.reduce((acc, curr) => acc + curr.durationMs, 0) / (1000 * 60 * 60)),
    topArtists: Array.from(topArtists.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topTracks: Array.from(topTracks.entries())
      .map(([full, count]) => ({ 
        name: full.split(" - ")[0], 
        artist: full.split(" - ")[1], 
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    chartData: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
      name: day,
      count: dailyActivity.get(day) || 0
    }))
  };
}
