import { AccessTokenRequest, makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { useEffect, useRef, useState } from "react";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { getSpotifyClientId } from "@/spotify/spotifyConfig";

const SCOPES = [
  "user-read-email",
  "user-library-read",
  "playlist-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
] as const;

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
} as const;

export function useSpotifyConnect() {
  const { setSpotifyTokenBundle, getSpotifyAccessToken } = useGlobalAudio();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lastCode = useRef<string | null>(null);
  const clientId = getSpotifyClientId();
  const redirectUri = makeRedirectUri({
    scheme: "sunshinesleepmask",
    path: "spotify-callback",
  });

  const [req, res, promptAsync] = useAuthRequest(
    {
      clientId: clientId || "placeholder",
      scopes: [...SCOPES],
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (!res || res.type !== "success" || !req) return;
    if (!("params" in res) || !res.params) return;
    const code = (res.params as { code?: string }).code ?? "";
    if (!code || !req.codeVerifier) return;
    if (lastCode.current === code) return;
    if (!clientId) {
      setErr("Set spotifyClientId in app.json (expo.extra) or EXPO_PUBLIC_SPOTIFY_CLIENT_ID");
      return;
    }
    lastCode.current = code;
    setBusy(true);
    setErr(null);
    (async () => {
      try {
        const ar = new AccessTokenRequest({
          clientId,
          code,
          redirectUri,
          extraParams: { code_verifier: req.codeVerifier ?? "" },
        });
        const tr = await ar.performAsync(discovery);
        setSpotifyTokenBundle({
          access: tr.accessToken,
          refresh: tr.refreshToken ?? "",
          expiresAt: Date.now() + (tr.expiresIn ?? 3600) * 1000,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Spotify token exchange failed";
        setErr(msg);
        console.error(e);
        lastCode.current = null;
      } finally {
        setBusy(false);
      }
    })();
  }, [res, req, clientId, redirectUri, setSpotifyTokenBundle]);

  return {
    promptConnect: promptAsync,
    busy,
    error: err,
    connected: Boolean(getSpotifyAccessToken()),
    hasClientId: Boolean(clientId),
  };
}
