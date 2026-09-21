/** Shape the OG image renderer and tests can share. Never throws on junk JSON. */

export interface RecapOgPayload {
  title: string;
  year: string;
  minutes: number;
  plays: number;
  vibe: string;
  topArtist: string | null;
  uniqueArtists: number;
}

export function recapOgPayload(title: string, data: unknown): RecapOgPayload | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const year = typeof d.timePeriod === "string" && d.timePeriod.trim() ? d.timePeriod.trim() : null;
  const minutes = typeof d.totalMinutes === "number" && Number.isFinite(d.totalMinutes) ? d.totalMinutes : null;
  const plays = typeof d.totalPlays === "number" && Number.isFinite(d.totalPlays) ? d.totalPlays : null;
  if (!year || minutes === null || plays === null) return null;

  const vibe = typeof d.listeningVibe === "string" && d.listeningVibe.trim()
    ? d.listeningVibe.trim()
    : "Balanced Listener";
  const uniqueArtists = typeof d.uniqueArtists === "number" && Number.isFinite(d.uniqueArtists)
    ? d.uniqueArtists
    : 0;

  let topArtist: string | null = null;
  if (Array.isArray(d.topArtists) && d.topArtists[0] && typeof d.topArtists[0] === "object") {
    const name = (d.topArtists[0] as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) topArtist = name.trim();
  }

  return {
    title: title.trim() || `Vinyl ${year}`,
    year,
    minutes,
    plays,
    vibe,
    topArtist,
    uniqueArtists,
  };
}

export function formatOgNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
