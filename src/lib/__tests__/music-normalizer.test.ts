import { describe, expect, it } from "vitest";
import { normalizeMusicName } from "../music-normalizer";

describe("normalizeMusicName", () => {
  it("groups case and whitespace variants without changing the display label", () => {
    expect(normalizeMusicName("  Radiohead  ")).toEqual({
      displayName: "Radiohead",
      canonicalKey: "radiohead",
    });
    expect(normalizeMusicName("RADIOHEAD").canonicalKey).toBe("radiohead");
  });

  it("removes common release suffixes from the canonical key", () => {
    expect(normalizeMusicName("Creep (Remastered 2009)").canonicalKey).toBe("creep");
    expect(normalizeMusicName("Creep - Radio Edit").canonicalKey).toBe("creep");
  });

  it("does not remove an arbitrary meaningful title suffix", () => {
    const name = normalizeMusicName("Song - Live Remix");
    expect(name.displayName).toBe("Song - Live Remix");
    expect(name.canonicalKey).toBe("song - live remix");
  });
});
