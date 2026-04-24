import Constants from "expo-constants";

export function getSpotifyClientId(): string {
  const fromExtra = (
    Constants.expoConfig?.extra as
      | { spotifyClientId?: string; spotifyClientID?: string }
      | undefined
  )?.spotifyClientId;
  const fromAlt = (
    Constants.expoConfig?.extra as
      | { spotifyClientID?: string }
      | undefined
  )?.spotifyClientID;
  return (
    (typeof fromExtra === "string" && fromExtra) ||
    (typeof fromAlt === "string" && fromAlt) ||
    process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ||
    ""
  );
}
