/**
 * Spotify Web API (fetch) — no expo-av. Playback is handled by the Spotify app
 * and routed to Bluetooth by the system.
 */
const API = "https://api.spotify.com/v1";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

const ACCOUNTS_TOKEN_URL = "https://accounts.spotify.com/api/token";

export type SpotifyTokenBundle = {
  access: string;
  refresh: string;
  expiresAt: number;
};

/** OAuth refresh — used by GlobalAudioContext; not for Web API resource calls. */
export async function refreshSpotifyAccessToken(
  clientId: string,
  refreshToken: string
): Promise<SpotifyTokenBundle> {
  console.log("[Spotify OAuth] refreshing access token");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const res = await fetch(ACCOUNTS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const txt = await res.text();
  if (!res.ok) {
    console.warn("[Spotify OAuth] refresh failed", res.status, txt);
    throw new Error(txt || res.statusText);
  }
  const j = JSON.parse(txt) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
  };
  console.log("[Spotify OAuth] token received (refresh)");
  return {
    access: j.access_token,
    refresh: j.refresh_token ?? refreshToken,
    expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000,
  };
}

export async function spotifyPauseWeb(token: string): Promise<Response> {
  return fetch(`${API}/me/player/pause`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
  });
}

export type SpotifyDevice = {
  id: string | null;
  is_active: boolean;
  is_restricted?: boolean;
  name: string;
  type: string;
  volume_percent?: number;
};

export async function getAvailableDevices(token: string): Promise<SpotifyDevice[]> {
  const r = await fetch(`${API}/me/player/devices`, { headers: authHeader(token) });
  if (r.status === 401) {
    throw new Error("SPOTIFY_AUTH");
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  const j = (await r.json()) as { devices?: SpotifyDevice[] };
  return j.devices ?? [];
}

/** Prefer the active device; otherwise first device with a usable id. */
export function pickPlaybackDeviceId(devices: SpotifyDevice[]): string | null {
  const withId = devices.filter((d): d is SpotifyDevice & { id: string } => Boolean(d.id));
  if (!withId.length) return null;
  const active = withId.find((d) => d.is_active);
  return (active ?? withId[0]).id;
}

export type SpotifyDeviceResolution =
  | { ok: true; deviceId: string }
  | { ok: false; message: string };

export async function resolveSpotifyPlaybackDevice(token: string): Promise<SpotifyDeviceResolution> {
  try {
    const devices = await getAvailableDevices(token);
    const deviceId = pickPlaybackDeviceId(devices);
    if (!devices.length) {
      return {
        ok: false,
        message: "Open Spotify and play something first",
      };
    }
    if (!deviceId) {
      return {
        ok: false,
        message: "No active Spotify device found",
      };
    }
    return { ok: true, deviceId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "SPOTIFY_AUTH") {
      return { ok: false, message: "Reconnect to Spotify (session expired)." };
    }
    return { ok: false, message: "Could not reach Spotify. Check your connection." };
  }
}

/** User-facing message for failed PUT /me/player/play */
export function spotifyFriendlyPlayError(status: number, body: string): string {
  if (status === 403) {
    try {
      const j = JSON.parse(body) as { error?: { reason?: string; message?: string } };
      const reason = j?.error?.reason ?? "";
      const message = j?.error?.message ?? "";
      if (reason === "PREMIUM_REQUIRED" || /premium/i.test(message) || /not available/i.test(message)) {
        return "Spotify Premium required";
      }
    } catch {
      /* */
    }
    return "Spotify Premium required";
  }
  if (status === 404) {
    if (/DEVICE_NOT_FOUND|device not found|No active device/i.test(body)) {
      return "No active Spotify device found";
    }
    return "Open Spotify to start playback";
  }
  if (status === 401) {
    return "Reconnect to Spotify (session expired).";
  }
  try {
    const j = JSON.parse(body) as { error?: { message?: string } };
    if (j?.error?.message && /premium/i.test(j.error.message)) {
      return "Spotify Premium required";
    }
  } catch {
    /* */
  }
  return body.trim() || `Spotify error (${status})`;
}

export async function spotifyPlayUris(
  token: string,
  uris: string[],
  deviceId: string
): Promise<Response> {
  const q = `?device_id=${encodeURIComponent(deviceId)}`;
  return fetch(`${API}/me/player/play${q}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ uris }),
  });
}

export async function spotifyPlayWithBody(
  token: string,
  body: Record<string, unknown>,
  deviceId: string
): Promise<Response> {
  const q = `?device_id=${encodeURIComponent(deviceId)}`;
  return fetch(`${API}/me/player/play${q}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function spotifyResumeOnDevice(token: string, deviceId: string): Promise<Response> {
  const q = `?device_id=${encodeURIComponent(deviceId)}`;
  return fetch(`${API}/me/player/play${q}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export async function spotifyPlayerNext(token: string, deviceId: string): Promise<Response> {
  const q = `?device_id=${encodeURIComponent(deviceId)}`;
  return fetch(`${API}/me/player/next${q}`, {
    method: "POST",
    headers: authHeader(token),
  });
}

export async function spotifyPlayerPrevious(token: string, deviceId: string): Promise<Response> {
  const q = `?device_id=${encodeURIComponent(deviceId)}`;
  return fetch(`${API}/me/player/previous${q}`, {
    method: "POST",
    headers: authHeader(token),
  });
}

/** Active track/episode from GET /me/player — needs `user-read-playback-state`. */
export type PlaybackItemMeta = {
  title: string;
  uri: string | null;
  isPlaying: boolean;
};

export async function getPlaybackItemMeta(token: string): Promise<PlaybackItemMeta | null> {
  const r = await fetch(`${API}/me/player`, { headers: authHeader(token) });
  if (r.status === 204) return null;
  if (!r.ok) return null;
  const j = (await r.json()) as {
    item?: { name?: string; uri?: string } | null;
    is_playing?: boolean;
  };
  const item = j.item;
  if (!item?.name || typeof item.name !== "string") return null;
  const title = item.name.trim();
  if (!title) return null;
  const uri = typeof item.uri === "string" ? item.uri : null;
  return { title, uri, isPlaying: Boolean(j.is_playing) };
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
  /** Present on `/me/playlists` items; omit optional chaining in UI anyway. */
  tracks?: { total: number };
  images?: { url: string }[];
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
