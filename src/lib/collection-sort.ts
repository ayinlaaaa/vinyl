export type ArtistSort = "plays-desc" | "plays-asc" | "name-asc" | "name-desc";

export interface NamedCount {
  name: string;
  count: number;
}

export const ARTIST_SORTS: { id: ArtistSort; label: string }[] = [
  { id: "plays-desc", label: "Most played" },
  { id: "plays-asc", label: "Least played" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
];

export function isArtistSort(value: string): value is ArtistSort {
  return ARTIST_SORTS.some((option) => option.id === value);
}

export function sortArtists<T extends NamedCount>(artists: T[], sort: ArtistSort): T[] {
  const copy = [...artists];
  switch (sort) {
    case "plays-desc":
      return copy.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    case "plays-asc":
      return copy.sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name) || b.count - a.count);
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name) || b.count - a.count);
  }
}
