export interface LastfmTrack {
  name: string;
  artist: {
    "#text": string;
    name?: string;
  };
  album: {
    "#text": string;
  };
  image: {
    "#text": string;
    size: string;
  }[];
  date?: {
    uts: string;
    "#text": string;
  };
  "@attr"?: {
    nowplaying: string;
  };
}

export async function fetchRecentTracks(username: string, apiKey: string, limit = 50) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch from Last.fm");
  }

  const data = await response.json();
  return data.recenttracks.track as LastfmTrack[];
}

export function normalizeLastfmTrack(track: LastfmTrack) {
  const artistName = typeof track.artist === 'string' ? track.artist : (track.artist?.["#text"] || "Unknown Artist");
  const albumArt = track.image?.find(img => img.size === 'large')?.["#text"] || null;
  
  return {
    trackName: track.name,
    artistName,
    albumName: track.album?.["#text"] || "Unknown Album",
    albumArtUrl: albumArt,
    playedAt: track.date ? new Date(parseInt(track.date.uts) * 1000) : new Date(),
    externalId: `lastfm-${track.date?.uts || 'now'}-${track.name}-${artistName}`.toLowerCase(),
    metadata: {
      provider: "lastfm",
      original: track
    }
  };
}
