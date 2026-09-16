import { describe, expect, it } from "vitest";
import { buildExternalId, toDate, toDurationMs, cleanText } from "../listening";

describe("buildExternalId", () => {
  it("is stable across casing and whitespace differences", () => {
    const a = buildExternalId("import", ["2026-01-01T00:00:00.000Z", "Radiohead", "Creep"]);
    const b = buildExternalId("import", ["2026-01-01T00:00:00.000Z", " radiohead", "CREEP  "]);
    expect(a).toBe(b);
  });

  it("distinguishes providers and parts", () => {
    expect(buildExternalId("spotify", ["x"])).not.toBe(buildExternalId("lastfm", ["x"]));
    expect(buildExternalId("import", ["a", "b"])).not.toBe(buildExternalId("import", ["b", "a"]));
  });
});

describe("toDurationMs", () => {
  it("rounds floats to integers (Spotify exports contain fractional ms)", () => {
    expect(toDurationMs(226722.29044914807)).toBe(226722);
  });
  it("accepts numeric strings", () => {
    expect(toDurationMs("1000")).toBe(1000);
  });
  it("returns null for missing or invalid values", () => {
    expect(toDurationMs(undefined)).toBeNull();
    expect(toDurationMs(null)).toBeNull();
    expect(toDurationMs(-5)).toBeNull();
    expect(toDurationMs(NaN)).toBeNull();
    expect(toDurationMs("abc")).toBeNull();
  });
});

describe("toDate", () => {
  it("parses ISO strings", () => {
    expect(toDate("2026-03-01T10:00:00Z")?.toISOString()).toBe("2026-03-01T10:00:00.000Z");
  });
  it("treats small numbers as unix seconds and large as milliseconds", () => {
    expect(toDate(1_700_000_000)?.getTime()).toBe(1_700_000_000_000);
    expect(toDate(1_700_000_000_000)?.getTime()).toBe(1_700_000_000_000);
  });
  it("rejects garbage", () => {
    expect(toDate("not a date")).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate(undefined)).toBeNull();
  });
});

describe("cleanText", () => {
  it("trims and nulls empties", () => {
    expect(cleanText("  hi ")).toBe("hi");
    expect(cleanText("   ")).toBeNull();
    expect(cleanText(42)).toBeNull();
  });
});
