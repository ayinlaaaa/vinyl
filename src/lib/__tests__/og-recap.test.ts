import { describe, expect, it } from "vitest";
import { formatOgNumber, recapOgPayload } from "../og-recap";

const sample = {
  timePeriod: "2026",
  totalMinutes: 1842,
  totalPlays: 411,
  listeningVibe: "Night Owl",
  uniqueArtists: 37,
  topArtists: [{ name: "Radiohead", count: 40 }],
};

describe("recapOgPayload", () => {
  it("extracts the fields the OG card needs", () => {
    expect(recapOgPayload("Vinyl 2026", sample)).toEqual({
      title: "Vinyl 2026",
      year: "2026",
      minutes: 1842,
      plays: 411,
      vibe: "Night Owl",
      topArtist: "Radiohead",
      uniqueArtists: 37,
    });
  });

  it("returns null when required numbers are missing", () => {
    expect(recapOgPayload("x", { timePeriod: "2026" })).toBeNull();
    expect(recapOgPayload("x", null)).toBeNull();
    expect(recapOgPayload("x", "nope")).toBeNull();
  });

  it("falls back when optional fields are absent", () => {
    const payload = recapOgPayload("  ", {
      timePeriod: "2026",
      totalMinutes: 10,
      totalPlays: 12,
    });
    expect(payload?.title).toBe("Vinyl 2026");
    expect(payload?.vibe).toBe("Balanced Listener");
    expect(payload?.topArtist).toBeNull();
    expect(payload?.uniqueArtists).toBe(0);
  });
});

describe("formatOgNumber", () => {
  it("groups thousands", () => {
    expect(formatOgNumber(1842)).toBe("1,842");
  });
});
