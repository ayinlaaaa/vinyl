import { subDays } from "date-fns";
import type { ListeningEvent } from "./listening";

/**
 * Demo data shown ONLY when the user has no listening history at all.
 * Every page that renders it receives `isMock: true` and must label it clearly.
 * This is never written to the database.
 */

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

    events.push({
      id: `mock-${i}`,
      trackName: track,
      artistName: artist.name,
      albumName: "Essential " + artist.name,
      playedAt: subDays(now, Math.random() * days),
      durationMs: Math.round(180000 + Math.random() * 120000),
      provider: "mock",
    });
  }

  return events.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
}
