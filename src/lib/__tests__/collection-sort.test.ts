import { describe, expect, it } from "vitest";
import { isArtistSort, sortArtists } from "../collection-sort";

const artists = [
  { name: "Radiohead", count: 12 },
  { name: "Aphex Twin", count: 4 },
  { name: "Daft Punk", count: 12 },
];

describe("sortArtists", () => {
  it("sorts by play count, breaking ties alphabetically", () => {
    expect(sortArtists(artists, "plays-desc").map((a) => a.name)).toEqual([
      "Daft Punk",
      "Radiohead",
      "Aphex Twin",
    ]);
    expect(sortArtists(artists, "plays-asc").map((a) => a.name)).toEqual([
      "Aphex Twin",
      "Daft Punk",
      "Radiohead",
    ]);
  });

  it("sorts by name", () => {
    expect(sortArtists(artists, "name-asc").map((a) => a.name)).toEqual([
      "Aphex Twin",
      "Daft Punk",
      "Radiohead",
    ]);
    expect(sortArtists(artists, "name-desc").map((a) => a.name)).toEqual([
      "Radiohead",
      "Daft Punk",
      "Aphex Twin",
    ]);
  });

  it("does not mutate the input", () => {
    const snapshot = artists.map((a) => a.name);
    sortArtists(artists, "name-asc");
    expect(artists.map((a) => a.name)).toEqual(snapshot);
  });
});

describe("isArtistSort", () => {
  it("narrows known sort ids", () => {
    expect(isArtistSort("plays-desc")).toBe(true);
    expect(isArtistSort("plays")).toBe(false);
  });
});
