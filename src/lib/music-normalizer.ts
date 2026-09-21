/**
 * Stable names for analytics without throwing away what the provider displayed.
 *
 * `displayName` is the cleaned value shown to people. `canonicalKey` is the value
 * used for grouping. The key removes a small, deliberately conservative set of
 * release/edit suffixes that otherwise split the same song into several entries.
 */
export interface NormalizedMusicName {
  displayName: string;
  canonicalKey: string;
}

const REMASTER_SUFFIX = /\s*(?:\([^)]*(?:re-?master(?:ed)?|remaster(?:ed)?|radio\s+edit|single\s+version|album\s+version)[^)]*\)|[-–—]\s*(?:(?:\d{4}\s+)?re-?master(?:ed)?(?:\s+\d{4})?|radio\s+edit|single\s+version|album\s+version))\s*$/iu;

function clean(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

/**
 * Normalize a provider's artist or track label.
 *
 * We retain the original cleaned display label and only remove unambiguous
 * version suffixes from the grouping key. That means a real title such as
 * "Song - Live Remix" is not silently renamed or merged.
 */
export function normalizeMusicName(value: string): NormalizedMusicName {
  const displayName = clean(value);
  let canonical = displayName;
  let previous = "";
  while (canonical !== previous) {
    previous = canonical;
    canonical = canonical.replace(REMASTER_SUFFIX, "").trim();
  }

  return {
    displayName,
    canonicalKey: canonical.toLowerCase().replace(/\s+/gu, " "),
  };
}

export function normalizeMusicPair(artistName: string, trackName: string) {
  return {
    artist: normalizeMusicName(artistName),
    track: normalizeMusicName(trackName),
  };
}
