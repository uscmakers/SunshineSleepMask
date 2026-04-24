import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export function SpotifyLibraryTab() {
  const g = useGlobalAudio();
  const { promptConnect, busy, error, connected, hasClientId } = useSpotifyConnect();
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [tracks, setTracks] = useState<{ track: SpotifyTrackItem }[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSimplified[]>([]);
  const [shows, setShows] = useState<SpotifyShowItem[]>([]);
  const token = g.getSpotifyAccessToken();

  const load = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    void load();
  }, [load, connected]);

  if (!hasClientId) {
    return (
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          Add <Text style={styles.code}>spotifyClientId</Text> under{" "}
          <Text style={styles.code}>expo.extra</Text> in app.json, then in the Spotify
          Developer dashboard add a Redirect URI that matches the app’s redirect (same
          scheme as <Text style={styles.code}>expo scheme</Text>, path{" "}
          <Text style={styles.code}>spotify-callback</Text>).
        </Text>
      </View>
    );
  }

  if (!connected) {
    return (
      <View>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <Pressable
          style={styles.btn}
          onPress={() => {
            void promptConnect();
          }}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={appTheme.colors.background} />
          ) : (
            <Text style={styles.btnText}>Connect Spotify</Text>
          )}
        </Pressable>
        <Text style={styles.note}>
          Premium may be required for API playback. Audio plays in the Spotify app and
          is routed to Bluetooth (e.g. your sleep mask) by iOS.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {loadErr ? <Text style={styles.err}>{loadErr}</Text> : null}
      {loading ? <ActivityIndicator color={appTheme.colors.accent} /> : null}
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
            onPress={() => void g.playSpotifyTrack(t.uri, t.name)}
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

      <Text style={styles.sec}>Your playlists</Text>
      {playlists.map((pl) => (
        <Pressable
          key={pl.id}
          style={styles.row}
          onPress={() =>
            void g.playSpotifyWithBody({ context_uri: pl.uri }, pl.name)
          }
        >
          {pl.images?.[0]?.url ? (
            <Image source={{ uri: pl.images[0].url }} style={styles.thumb} />
          ) : (
            <View style={styles.thumb} />
          )}
          <View style={styles.info}>
            <Text style={styles.t}>{pl.name}</Text>
            <Text style={styles.sub}>{pl.tracks.total} tracks</Text>
          </View>
          <Text style={styles.pill}>▶</Text>
        </Pressable>
      ))}

      <Text style={styles.sec}>Podcasts (your shows)</Text>
      {shows.map((sh) => (
        <Pressable
          key={sh.id}
          style={styles.row}
          onPress={() =>
            void g.playSpotifyWithBody({ context_uri: sh.uri }, sh.name)
          }
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

      <Text style={styles.footNote}>
        Sleep timer does not stop Spotify — use the Spotify app to end playback.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hintBox: {
    padding: appTheme.space.lg,
    backgroundColor: appTheme.colors.warningBg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.warningBorder,
  },
  hintText: { color: appTheme.colors.textInsightBody, fontSize: appTheme.type.body },
  code: { fontFamily: appTheme.fonts.medium, color: appTheme.colors.text },
  btn: {
    backgroundColor: appTheme.colors.accent,
    paddingVertical: 14,
    borderRadius: appTheme.radii.md,
    alignItems: "center",
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
