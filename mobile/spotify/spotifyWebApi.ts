/**
 * Spotify Web API (fetch) — no expo-av. Playback is handled by the Spotify app
 * and routed to Bluetooth by the system.
 */
const API = "https://api.spotify.com/v1";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function spotifyPauseWeb(token: string): Promise<Response> {
  return fetch(`${API}/me/player/pause`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
  });
}

export async function spotifyPlayUris(
  token: string,
  uris: string[],
  deviceId?: string
): Promise<Response> {
  const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  return fetch(`${API}/me/player/play${q}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ uris }),
  });
}

export type SpotifyTrackItem = {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string; height: number; width: number }[] };
};

export async function getSavedTracks(
  token: string
): Promise<{ items: { track: SpotifyTrackItem }[] }> {
  const r = await fetch(`${API}/me/tracks?limit=20`, { headers: authHeader(token) });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json() as Promise<{ items: { track: SpotifyTrackItem }[] }>;
}

export type SpotifyPlaylistSimplified = {
  id: string;
  name: string;
  uri: string;
  tracks: { total: number };
  images: { url: string }[];
};

export async function getUserPlaylists(
  token: string
): Promise<{ items: SpotifyPlaylistSimplified[] }> {
  const r = await fetch(`${API}/me/playlists?limit=20`, {
    headers: authHeader(token),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json() as Promise<{ items: SpotifyPlaylistSimplified[] }>;
}

export type SpotifyShowItem = {
  id: string;
  uri: string;
  name: string;
  publisher: string;
  images: { url: string }[];
};

export async function getUserShows(
  token: string
): Promise<{ items: { show: SpotifyShowItem }[] }> {
  const r = await fetch(`${API}/me/shows?limit=20`, {
    headers: authHeader(token),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json() as Promise<{ items: { show: SpotifyShowItem }[] }>;
}
