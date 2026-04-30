import { makeRedirectUri } from "expo-auth-session";
import Constants, { ExecutionEnvironment } from "expo-constants";
import sessionUrlProvider from "expo-auth-session/build/SessionUrlProvider";
import { NativeModules } from "react-native";

import appJson from "../app.json";

type AppJsonShape = {
  expo?: {
    owner?: string;
    slug?: string;
    scheme?: string;
    extra?: Record<string, unknown>;
  };
};

/**
 * Expo Auth proxy URLs must use `@owner/slug` (see https://auth.expo.io). A path without `@`
 * returns "Not Found" from auth.expo.io.
 */
function defaultExpoAuthProxyRedirect(): string {
  const expo = (appJson as AppJsonShape).expo;
  const owner = typeof expo?.owner === "string" && expo.owner ? expo.owner : "claykoessler";
  const slug = typeof expo?.slug === "string" && expo.slug ? expo.slug : "SunshineSleepMask";
  return `https://auth.expo.io/@${owner}/${slug}`;
}

/** Ensure `https://auth.expo.io/owner/slug` becomes `https://auth.expo.io/@owner/slug`. */
function normalizeExpoAuthProxyRedirect(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed.includes("auth.expo.io")) return trimmed;
  try {
    const u = new URL(trimmed);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 1 && !parts[0].startsWith("@")) {
      u.pathname = "/" + ["@" + parts[0], ...parts.slice(1)].join("/");
      return u.toString().replace(/\/+$/, "");
    }
  } catch {
    /* */
  }
  return trimmed;
}

function extractExtraFromAppConfig(config: unknown): Record<string, unknown> | undefined {
  if (!config || typeof config !== "object") return undefined;
  const o = config as Record<string, unknown>;
  const direct = o.extra;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  const expo = o.expo;
  if (expo && typeof expo === "object") {
    return extractExtraFromAppConfig(expo);
  }
  return undefined;
}

/** `expo.extra` from bundled app.json — reliable in Expo Go when Constants manifest omits extra. */
function getBundledExtra(): Record<string, unknown> | undefined {
  return extractExtraFromAppConfig(appJson as AppJsonShape);
}

/** `expo.extra` from native manifest / expo-constants (OTA, dev client, etc.). */
function getExpoExtraFromConstants(): Record<string, unknown> | undefined {
  const fromExpoConfig = extractExtraFromAppConfig(Constants.expoConfig);
  if (fromExpoConfig && Object.keys(fromExpoConfig).length > 0) {
    return fromExpoConfig;
  }

  const m2 = Constants.manifest2 as
    | { extra?: { expoClient?: Record<string, unknown> } }
    | null
    | undefined;
  const fromM2Client = extractExtraFromAppConfig(m2?.extra?.expoClient);
  if (fromM2Client && Object.keys(fromM2Client).length > 0) {
    return fromM2Client;
  }

  const fromManifest = extractExtraFromAppConfig(Constants.manifest);
  if (fromManifest && Object.keys(fromManifest).length > 0) {
    return fromManifest;
  }

  try {
    const raw = (NativeModules as { ExponentConstants?: { manifest?: string | object } })
      .ExponentConstants?.manifest;
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const fromNative = extractExtraFromAppConfig(parsed);
      if (fromNative && Object.keys(fromNative).length > 0) {
        return fromNative;
      }
    }
  } catch {
    /* */
  }

  return undefined;
}

/** Merged `expo.extra`: bundled app.json wins over runtime manifest for the same keys. */
function getMergedExtra(): Record<string, unknown> {
  const fromConstants = getExpoExtraFromConstants() ?? {};
  const fromBundled = getBundledExtra() ?? {};
  return { ...fromConstants, ...fromBundled };
}

/**
 * `@account/slug` for the Expo Auth proxy — prefer runtime `originalFullName` so it matches
 * Expo Go / your logged-in Expo account (Spotify requires an exact redirect_uri match).
 */
function projectFullNameForExpoProxy(): string {
  const ofn = Constants.expoConfig?.originalFullName;
  if (typeof ofn === "string" && ofn.trim().length > 0) {
    return ofn.startsWith("@") ? ofn.trim() : `@${ofn.trim()}`;
  }
  const expo = (appJson as AppJsonShape).expo;
  const owner = (typeof expo?.owner === "string" ? expo.owner : "claykoessler").replace(/^@/, "");
  const slug = typeof expo?.slug === "string" && expo.slug ? expo.slug : "SunshineSleepMask";
  return `@${owner}/${slug}`;
}

/** True only in Expo Go — OAuth uses https://auth.expo.io/...@owner/slug (fragile; prefer a dev build). */
export function usesExpoAuthProxy(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function getSpotifyRedirectUri(): string {
  /** Only use when you must force a URI — otherwise Expo canonical URL + Spotify exact match breaks. */
  const forced = getMergedExtra().spotifyRedirectUri;
  if (typeof forced === "string" && forced.trim().length > 0) {
    return normalizeExpoAuthProxyRedirect(forced.trim());
  }

  // Dev client / standalone / web: native scheme or Linking URL — avoids auth.expo.io relay (stable for Spotify allowlist).
  if (!usesExpoAuthProxy()) {
    const expo = (appJson as AppJsonShape).expo;
    const scheme =
      typeof expo?.scheme === "string" && expo.scheme.trim().length > 0
        ? expo.scheme.trim()
        : "sunshinesleepmask";
    return makeRedirectUri({
      scheme,
      path: "spotify-oauth",
    });
  }

  try {
    return sessionUrlProvider.getRedirectUrl({
      projectNameForProxy: projectFullNameForExpoProxy(),
    });
  } catch {
    return normalizeExpoAuthProxyRedirect(defaultExpoAuthProxyRedirect());
  }
}

export function getSpotifyClientId(): string {
  const extra = getMergedExtra();
  const fromExtra = extra.spotifyClientId;
  const fromAlt = extra.spotifyClientID;
  const fromEnv = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

  if (typeof fromExtra === "string" && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }
  if (typeof fromAlt === "string" && fromAlt.trim().length > 0) {
    return fromAlt.trim();
  }
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return "";
}
