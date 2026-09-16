import { buildExternalId, type NewListeningRow } from "../listening";

export interface AppleMusicTrack {
  id: string;
  type: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    artwork?: {
      url: string;
      width: number;
      height: number;
    };
    durationInMillis?: number;
    playParams?: {
      id: string;
      kind: string;
    };
  };
}

export async function getRecentlyPlayed(developerToken: string, musicUserToken: string, limit = 30) {
  const url = `https://api.music.apple.com/v1/me/recent/played/tracks?limit=${limit}&types=songs`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${developerToken}`,
      'Music-User-Token': musicUserToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch Apple Music tracks");
  }

  const data = await response.json();
  return data.data as AppleMusicTrack[];
}

/**
 * IMPORTANT LIMITATION: Apple's `me/recent/played/tracks` endpoint returns an ordered
 * list of recently played songs but NO play timestamps and NO play counts. We therefore
 * cannot record real listening events from it.
 *
 * What we do instead: record each track at most once per (track, sync day). `playedAt`
 * is the sync time and is an ESTIMATE – the UI must label Apple Music data accordingly.
 */
export function normalizeAppleTrack(track: AppleMusicTrack, userId: string, syncedAt: Date): NewListeningRow {
  const attr = track.attributes;
  const albumArt = attr.artwork?.url?.replace("{w}", "400")?.replace("{h}", "400") || null;
  const day = syncedAt.toISOString().slice(0, 10);

  return {
    userId,
    provider: "apple",
    trackName: attr.name,
    artistName: attr.artistName,
    albumName: attr.albumName || null,
    albumArtUrl: albumArt,
    playedAt: syncedAt,
    durationMs: attr.durationInMillis ?? null,
    externalId: buildExternalId("apple", [day, track.id]),
    metadata: { appleId: track.id, timestampEstimated: true },
  };
}
