import { describe, expect, it } from "vitest";
import { normalizeImport } from "../import-normalizer";

const USER = "00000000-0000-0000-0000-000000000001";

describe("normalizeImport", () => {
  it("accepts Spotify extended streaming history rows", () => {
    const { rows, rejected } = normalizeImport(
      [
        {
          ts: "2025-11-02T21:14:05Z",
          ms_played: 201_233.7,
          master_metadata_track_name: "Paranoid Android",
          master_metadata_album_artist_name: "Radiohead",
          master_metadata_album_album_name: "OK Computer",
          spotify_track_uri: "spotify:track:6LgJvl0Xdtc73RJ1mmpotq",
        },
      ],
      USER
    );
    expect(rejected).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: USER,
      provider: "import",
      trackName: "Paranoid Android",
      artistName: "Radiohead",
      albumName: "OK Computer",
      durationMs: 201_234,
    });
    expect(rows[0].externalId).toContain("spotify:track:6lgjvl0xdtc73rj1mmpotq");
  });

  it("accepts Spotify account-data StreamingHistory rows", () => {
    const { rows } = normalizeImport(
      [{ endTime: "2025-06-01 14:22", artistName: "Daft Punk", trackName: "Get Lucky", msPlayed: 248000 }],
      USER
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].durationMs).toBe(248000);
  });

  it("accepts VINYL's simple format and treats a lone object as a one-item list", () => {
    const { rows } = normalizeImport(
      { trackName: "Xtal", artistName: "Aphex Twin", playedAt: "2026-01-05T08:00:00Z" },
      USER
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].durationMs).toBeNull();
    expect(rows[0].albumName).toBeNull();
  });

  it("rejects rows with missing fields and explains why", () => {
    const { rows, rejected } = normalizeImport(
      [
        { ts: "2025-01-01T00:00:00Z", master_metadata_track_name: null, master_metadata_album_artist_name: null }, // podcast / local file
        { trackName: "X", artistName: "Y", playedAt: "nope" },
        "not an object",
        { trackName: "Future", artistName: "Z", playedAt: "2999-01-01T00:00:00Z" },
      ],
      USER
    );
    expect(rows).toHaveLength(0);
    expect(rejected.map((r) => r.reason)).toEqual([
      "missing track name",
      "missing or invalid timestamp",
      "not an object",
      "timestamp is in the future",
    ]);
  });

  it("collapses exact duplicates within one file", () => {
    const row = { trackName: "Creep", artistName: "Radiohead", playedAt: "2026-02-02T02:02:02Z", durationMs: 1000 };
    const { rows, duplicatesInFile } = normalizeImport([row, { ...row }, { ...row, durationMs: 2000 }], USER);
    expect(rows).toHaveLength(1);
    expect(duplicatesInFile).toBe(2);
  });
});
