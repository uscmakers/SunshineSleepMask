import { AccessTokenRequest, makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { useCallback, useEffect, useRef, useState } from "react";

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

/** Maps Authorization Code exchange failures to stable UI copy. */
function mapTokenExchangeError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const lower = raw.toLowerCase();
  if (lower.includes("redirect") && (lower.includes("uri") || lower.includes("mismatch"))) {
    return "Invalid redirect URI";
  }
  if (lower.includes("invalid_client")) {
    return "Missing Client ID";
  }
  return "Token exchange failed";
}

export function useSpotifyConnect() {
  const { setSpotifyTokenBundle, getSpotifyAccessToken } = useGlobalAudio();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const lastCode = useRef<string | null>(null);
  const clientId = getSpotifyClientId();

  /**
   * This MUST exactly match the Spotify dashboard redirect URI (scheme + path), registered in the
   * Spotify Developer Dashboard for this app.
   */
  const redirectUri = makeRedirectUri({
    scheme: "sunshinesleepmask",
    path: "spotify-callback",
  });

  useEffect(() => {
    console.log("Spotify redirect URI:", redirectUri);
  }, [redirectUri]);

  const [req, res, rawPromptAsync] = useAuthRequest(
    {
      clientId: clientId ?? "",
      scopes: [...SCOPES],
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  const promptConnect = useCallback(
    async (...args: Parameters<typeof rawPromptAsync>) => {
      if (!clientId) {
        setErr("Spotify Client ID missing. Set expo.extra.spotifyClientId");
        return undefined;
      }
      setErr(null);
      console.log("[Spotify OAuth] login starting");
      try {
        const result = await rawPromptAsync(...args);
        if (result.type === "error") {
          setErr("Spotify login failed");
        } else if (result.type !== "success") {
          setErr(null);
        }
        return result;
      } catch {
        setErr("Spotify login failed");
        return undefined;
      }
    },
    [clientId, rawPromptAsync]
  );

  const checkConnection = useCallback(async () => {
    try {
      const token = await getSpotifyAccessToken();
      setConnected(!!token);
    } catch {
      setConnected(false);
    }
  }, [getSpotifyAccessToken]);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    const id = setInterval(() => {
      void checkConnection();
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, [checkConnection]);

  useEffect(() => {
    console.log("Spotify connected:", connected);
  }, [connected]);

  const disconnectSpotify = useCallback(() => {
    setSpotifyTokenBundle(null);
    lastCode.current = null;
    setErr(null);
    setConnected(false);
    void checkConnection();
  }, [checkConnection, setSpotifyTokenBundle]);

  useEffect(() => {
    if (!res || res.type !== "success" || !req) return;
    if (!("params" in res) || !res.params) return;
    const code = (res.params as { code?: string }).code ?? "";
    if (!code || !req.codeVerifier) return;
    if (lastCode.current === code) return;
    if (!clientId) {
      setErr("Spotify Client ID missing. Set expo.extra.spotifyClientId");
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
        console.log("[Spotify OAuth] token received (initial exchange)");
        setSpotifyTokenBundle({
          access: tr.accessToken,
          refresh: tr.refreshToken ?? "",
          expiresAt: Date.now() + (tr.expiresIn ?? 3600) * 1000,
        });
        setErr(null);
        setConnected(true);
        void checkConnection();
      } catch (e) {
        const msg = mapTokenExchangeError(e);
        setErr(msg);
        console.error(e);
        lastCode.current = null;
      } finally {
        setBusy(false);
      }
    })();
  }, [checkConnection, res, req, clientId, redirectUri, setSpotifyTokenBundle]);

  return {
    promptConnect,
    busy,
    error: err,
    connected,
    hasClientId: Boolean(clientId),
    disconnectSpotify,
    /** Re-read token from context (e.g. when screen gains focus). */
    refreshConnection: checkConnection,
  };
}
