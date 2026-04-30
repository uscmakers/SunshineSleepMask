import { AccessTokenRequest, useAuthRequest } from "expo-auth-session";
import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import {
  getSpotifyClientId,
  getSpotifyRedirectUri,
  usesExpoAuthProxy,
} from "@/spotify/spotifyConfig";

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
  const redirectUri = getSpotifyRedirectUri();

  useEffect(() => {
    console.log("Spotify redirect URI (must match Spotify Dashboard exactly):", redirectUri);
    console.log("Spotify OAuth uses Expo auth proxy (Expo Go):", usesExpoAuthProxy());
    console.log("Expo originalFullName:", Constants.expoConfig?.originalFullName ?? "(none)");
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

  const promptConnect = useCallback(
    async (...args: Parameters<typeof rawPromptAsync>) => {
      if (!clientId) {
        setErr("Spotify Client ID missing. Set expo.extra.spotifyClientId");
        return undefined;
      }
      setErr(null);
      console.log("[Spotify OAuth] login starting");
      try {
        const result = await rawPromptAsync({
          preferEphemeralSession: false,
          ...args[0],
        });
        if ("url" in result && result.url) {
          console.log("[Spotify OAuth] prompt result:", result.type, result.url.slice(0, 180));
        } else {
          console.log("[Spotify OAuth] prompt result:", result.type);
        }
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

  const disconnectSpotify = useCallback(() => {
    setSpotifyTokenBundle(null);
    lastCode.current = null;
    setErr(null);
    setConnected(false);
  }, [setSpotifyTokenBundle]);

  useEffect(() => {
    console.log("Spotify connected:", connected);
  }, [connected]);

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
      } catch (e) {
        const msg = mapTokenExchangeError(e);
        setErr(msg);
        console.error(e);
        lastCode.current = null;
      } finally {
        setBusy(false);
      }
    })();
  }, [clientId, redirectUri, req, res, setSpotifyTokenBundle]);

  return {
    promptConnect,
    busy,
    error: err,
    connected,
    hasClientId: Boolean(clientId),
    disconnectSpotify,
    refreshConnection: checkConnection,
  };
}
