import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { useSpotifyConnect } from "@/components/sound/useSpotifyConnect";
import { appTheme } from "@/theme/appTheme";
import {
  getSavedTracks,
  getUserPlaylists,
  getUserShows,
  type SpotifyPlaylistSimplified,
  type SpotifyShowItem,
  type SpotifyTrackItem,
} from "@/spotify/spotifyWebApi";
import { getSpotifyRedirectUri, usesExpoAuthProxy } from "@/spotify/spotifyConfig";

export function SpotifyLibraryTab() {
  const g = useGlobalAudio();
  const {
    promptConnect,
    busy,
    error,
    connected,
    hasClientId,
    disconnectSpotify,
    refreshConnection,
  } = useSpotifyConnect();

  useFocusEffect(
    useCallback(() => {
      void refreshConnection();
      void g.refreshSpotifyPlaybackDisplay();
    }, [refreshConnection, g.refreshSpotifyPlaybackDisplay])
  );
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [tracks, setTracks] = useState<{ track: SpotifyTrackItem }[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSimplified[]>([]);
  const [shows, setShows] = useState<SpotifyShowItem[]>([]);
  const [spotifyPlaybackHint, setSpotifyPlaybackHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const showPlayingOnMaskHint = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setSpotifyPlaybackHint("Playing on SleepMask");
    hintTimerRef.current = setTimeout(() => setSpotifyPlaybackHint(null), 4000);
  }, []);

  const playTrack = useCallback(
    async (uri: string, title: string) => {
      const err = await g.playSpotifyTrack(uri, title);
      if (err) {
        Alert.alert("Spotify", err);
        return;
      }
      showPlayingOnMaskHint();
    },
    [g, showPlayingOnMaskHint]
  );

  const playContext = useCallback(
    async (body: Record<string, unknown>, title: string) => {
      const err = await g.playSpotifyWithBody(body, title);
      if (err) {
        Alert.alert("Spotify", err);
        return;
      }
      showPlayingOnMaskHint();
    },
    [g, showPlayingOnMaskHint]
  );

  const load = useCallback(async () => {
    const token = await g.getSpotifyAccessToken();
    if (!token) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const [t, p, s] = await Promise.all([
        getSavedTracks(token),
        getUserPlaylists(token),
        getUserShows(token),
      ]);
      setTracks(t.items ?? []);
      setPlaylists(p.items ?? []);
      setShows(s.items.map((i) => i.show).filter(Boolean));
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [g]);

  useEffect(() => {
    void load();
  }, [load, connected]);

  if (!connected) {
    const redirectForDocs = getSpotifyRedirectUri();
    const proxy = usesExpoAuthProxy();
    return (
      <View>
        {!hasClientId ? (
          <Text style={styles.connectHint}>
            Set <Text style={styles.connectHintStrong}>spotifyClientId</Text> under{" "}
            <Text style={styles.connectHintStrong}>expo.extra</Text> in app.json and restart Expo (
            <Text style={styles.connectHintStrong}>npx expo start -c</Text> if it still doesn’t load).
            In the Spotify Developer Dashboard, Redirect URIs: copy the exact URI from Metro logs (
            <Text style={styles.connectHintStrong}>Spotify redirect URI...</Text>). It must match
            exactly.
            {proxy ? (
              <>
                {" "}
                In Expo Go the redirect looks like{" "}
                <Text style={styles.connectHintStrong}>https://auth.expo.io/@owner/slug</Text>.
              </>
            ) : (
              <>
                {" "}
                With a dev build or standalone app it looks like{" "}
                <Text style={styles.connectHintStrong}>your-scheme://spotify-oauth</Text>.
              </>
            )}
            {"\n\n"}
            You can also set <Text style={styles.connectHintStrong}>EXPO_PUBLIC_SPOTIFY_CLIENT_ID</Text>{" "}
            and restart the bundler.
          </Text>
        ) : (
          <Text style={styles.connectHint}>
            Spotify Redirect URI (must match exactly):{" "}
            <Text style={styles.connectHintStrong}>{redirectForDocs}</Text>
            {"\n\n"}
            {proxy ? (
              <>
                Expo Go uses auth.expo.io to hand control back to the app; that step often fails with
                “Something went wrong.” Try{" "}
                <Text style={styles.connectHintStrong}>npx expo login</Text>, then{" "}
                <Text style={styles.connectHintStrong}>npx expo start --tunnel</Text>, and retry.
                For a stable OAuth flow, run a development build (
                <Text style={styles.connectHintStrong}>expo-dev-client</Text>) so the redirect uses your
                app scheme (see Metro logs) instead of auth.expo.io.
              </>
            ) : (
              <>
                Add the URI above to your Spotify app’s Redirect URIs. Rebuild the native app if you
                change <Text style={styles.connectHintStrong}>scheme</Text> or this path.
              </>
            )}
          </Text>
        )}
        {error && !busy ? <Text style={styles.err}>{error}</Text> : null}
        <Pressable
          style={[styles.btn, (busy || !hasClientId) && styles.btnDisabled]}
          onPress={() => {
            void promptConnect();
          }}
          disabled={busy || !hasClientId}
        >
          {busy ? (
            <ActivityIndicator color={appTheme.colors.background} />
          ) : (
            <Text style={styles.btnText}>Connect Spotify</Text>
          )}
        </Pressable>
        {busy ? (
          <View style={styles.connectingRow} accessibilityRole="progressbar">
            <ActivityIndicator color={appTheme.colors.accent} />
            <Text style={styles.connectingText}>Connecting to Spotify…</Text>
          </View>
        ) : null}
        <Text style={styles.note}>
          Premium may be required for API playback. Audio plays in the Spotify app and
          is routed to Bluetooth (e.g. your sleep mask) by iOS.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.connectedRow}>
        <Text style={styles.connectedLabel}>Connected to Spotify</Text>
        <Pressable
          style={styles.disconnectBtn}
          onPress={() => disconnectSpotify()}
          accessibilityRole="button"
          accessibilityLabel="Disconnect Spotify"
        >
          <Text style={styles.disconnectBtnText}>Disconnect Spotify</Text>
        </Pressable>
      </View>
      <Text style={styles.helper}>
        Make sure your SleepMask is connected via Bluetooth and Spotify is open.
      </Text>
      {spotifyPlaybackHint ? (
        <Text style={styles.playbackHint}>{spotifyPlaybackHint}</Text>
      ) : null}
      {loadErr ? <Text style={styles.err}>{loadErr}</Text> : null}
      {loading ? <ActivityIndicator color={appTheme.colors.accent} /> : null}
      <Text style={styles.sec}>Your playlists</Text>
      {playlists.map((pl) => (
        <Pressable
          key={pl.id}
          style={styles.row}
          onPress={() => void playContext({ context_uri: pl.uri }, pl.name)}
        >
          {pl.images?.[0]?.url ? (
            <Image source={{ uri: pl.images[0].url }} style={styles.thumb} />
          ) : (
            <View style={styles.thumb} />
          )}
          <View style={styles.info}>
            <Text style={styles.t}>{pl.name}</Text>
            <Text style={styles.sub}>
              {pl.tracks?.total != null ? `${pl.tracks.total} tracks` : "Playlist"}
            </Text>
          </View>
          <Text style={styles.pill}>▶</Text>
        </Pressable>
      ))}

      <Text style={styles.sec}>Podcasts (your shows)</Text>
      {shows.map((sh) => (
        <Pressable
          key={sh.id}
          style={styles.row}
          onPress={() => void playContext({ context_uri: sh.uri }, sh.name)}
        >
          {sh.images?.[0]?.url ? (
            <Image source={{ uri: sh.images[0].url }} style={styles.thumb} />
          ) : (
            <View style={styles.thumb} />
          )}
          <View style={styles.info}>
            <Text style={styles.t}>{sh.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {sh.publisher}
            </Text>
          </View>
          <Text style={styles.pill}>▶</Text>
        </Pressable>
      ))}

      <Text style={styles.sec}>Saved tracks</Text>
      {tracks.map((row) => {
        const t = row.track;
        if (!t) return null;
        const art = t.album?.images?.[0]?.url;
        const isOn = g.currentTrackId === t.uri && g.source === "spotify" && g.isPlaying;
        return (
          <Pressable
            key={t.id}
            style={[styles.row, isOn && styles.rowOn]}
            onPress={() => void playTrack(t.uri, t.name)}
          >
            {art ? (
              <Image source={{ uri: art }} style={styles.thumb} />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={styles.info}>
              <Text style={styles.t}>{t.name}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {t.artists?.map((a) => a.name).join(", ")}
              </Text>
            </View>
            <Text style={styles.pill}>{isOn ? "⏸" : "▶"}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.footNote}>
        When a sleep timer is set on the Sounds screen, playback stops when time runs out.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Same typography as `note` (premium disclaimer); spacing only differs above the button. */
  connectHint: {
    marginTop: 0,
    marginBottom: appTheme.space.md,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.caption,
  },
  connectHintStrong: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.caption,
  },
  btn: {
    backgroundColor: appTheme.colors.accent,
    paddingVertical: 14,
    borderRadius: appTheme.radii.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.85 },
  connectingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: appTheme.space.md,
  },
  connectingText: {
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.caption,
  },
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: appTheme.space.md,
    flexWrap: "wrap",
  },
  connectedLabel: {
    color: appTheme.colors.accent,
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.body,
    flex: 1,
    minWidth: 140,
  },
  disconnectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  disconnectBtnText: {
    color: appTheme.colors.textSecondary,
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.caption,
  },
  btnText: {
    color: appTheme.colors.background,
    fontFamily: appTheme.fonts.medium,
  },
  note: {
    marginTop: appTheme.space.lg,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.caption,
  },
  helper: {
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.caption,
    marginBottom: appTheme.space.md,
  },
  playbackHint: {
    color: appTheme.colors.accent,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: appTheme.fonts.medium,
  },
  err: { color: appTheme.colors.warningText, marginBottom: 8, fontSize: 13 },
  sec: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.section,
    color: appTheme.colors.text,
    marginTop: appTheme.space.lg,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    marginBottom: 8,
    gap: 10,
  },
  rowOn: { borderColor: appTheme.colors.accent },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: appTheme.colors.surfaceRow,
  },
  info: { flex: 1, minWidth: 0 },
  t: { fontFamily: appTheme.fonts.medium, color: appTheme.colors.text },
  sub: { color: appTheme.colors.textSecondary, fontSize: appTheme.type.caption },
  pill: { color: appTheme.colors.accent, fontSize: 18, paddingRight: 4 },
  footNote: { marginTop: 16, color: appTheme.colors.textMuted, fontSize: 12 },
});
