import { describe, expect, it } from "vitest";
import { computeStats, formatMinutes, peakHour } from "../analytics";
import type { ListeningEvent } from "../listening";

function ev(partial: Partial<ListeningEvent> & { trackName: string; artistName: string }): ListeningEvent {
  return {
    id: Math.random().toString(36).slice(2),
    albumName: null,
    playedAt: new Date(2026, 0, 5, 23, 0, 0), // Monday 23:00 local
    durationMs: 60_000,
    provider: "import",
    ...partial,
  };
}

describe("computeStats", () => {
  it("counts plays, unique artists/tracks and sums minutes", () => {
    const stats = computeStats([
      ev({ trackName: "A", artistName: "X" }),
      ev({ trackName: "A", artistName: "X" }),
      ev({ trackName: "B", artistName: "Y", durationMs: 120_000 }),
    ]);
    expect(stats.totalPlays).toBe(3);
    expect(stats.uniqueArtists).toBe(2);
    expect(stats.uniqueTracks).toBe(2);
    expect(stats.totalMinutes).toBe(4);
    expect(stats.topArtists[0]).toEqual({ name: "X", count: 2 });
    expect(stats.topTracks[0]).toEqual({ name: "A", artist: "X", count: 2 });
  });

  it("does not split track titles that contain ' - '", () => {
    const stats = computeStats([ev({ trackName: "Song - Live Remix", artistName: "Band" })]);
    expect(stats.topTracks[0]).toEqual({ name: "Song - Live Remix", artist: "Band", count: 1 });
  });

  it("tracks plays with unknown duration instead of counting them as zero silently", () => {
    const stats = computeStats([
      ev({ trackName: "A", artistName: "X", durationMs: null, provider: "lastfm" }),
      ev({ trackName: "B", artistName: "X" }),
    ]);
    expect(stats.playsWithoutDuration).toBe(1);
    expect(stats.totalMinutes).toBe(1);
  });

  it("buckets by weekday (Monday first) and hour", () => {
    const stats = computeStats([ev({ trackName: "A", artistName: "X" })]);
    expect(stats.weekdayActivity[0]).toEqual({ name: "Mon", count: 1 });
    expect(stats.hourlyActivity[23]).toBe(1);
  });

  it("returns empty-but-valid stats for no events", () => {
    const stats = computeStats([]);
    expect(stats.totalPlays).toBe(0);
    expect(stats.topArtists).toEqual([]);
    expect(peakHour(stats.hourlyActivity)).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("formats hours and minutes", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(59)).toBe("59m");
    expect(formatMinutes(125)).toBe("2h 5m");
  });
});
