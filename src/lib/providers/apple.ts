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

export function normalizeAppleTrack(track: AppleMusicTrack) {
  const attr = track.attributes;
  // Apple Music artwork URL uses {w} and {h} as placeholders
  const albumArt = attr.artwork?.url
    ?.replace('{w}', '400')
    ?.replace('{h}', '400') || null;
  
  return {
    trackName: attr.name,
    artistName: attr.artistName,
    albumName: attr.albumName,
    albumArtUrl: albumArt,
    playedAt: new Date(), // Apple Music API recent tracks doesn't always provide a precise playedAt timestamp in the attributes, 
                           // we might need to rely on the order or check for other fields.
                           // Actually, for "recent", it's usually current time for the sync.
    durationMs: attr.durationInMillis || 0,
    externalId: `apple-${track.id}-${Date.now()}`.toLowerCase(), // Since we don't have a timestamp, we have to be careful with duplicates.
                                                                // Usually, id is static, but we sync "recent".
    metadata: {
      provider: "apple",
      appleId: track.id,
    }
  };
}
