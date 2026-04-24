import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { SpotifyLibraryTab } from "@/components/sound/SpotifyLibraryTab";
import { AMBIENT_TRACKS, MEDITATION_TRACKS } from "@/components/sound/soundTracks";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

type Tab = "ambient" | "meditation" | "library";

function formatRemaining(sec: number) {
  if (sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SoundScreen() {
  const g = useGlobalAudio();
  const [tab, setTab] = useState<Tab>("ambient");

  const nowPlaying = g.currentTrack && g.source !== "idle";
  const timerLine = useMemo(() => {
    if (g.sleepTimerSelectMin <= 0) {
      return "Off";
    }
    if (!g.timerEndAt || g.source === "spotify") {
      return `${g.sleepTimerSelectMin} min selected${
        g.source === "spotify" ? " (not applied to Spotify)" : ""
      }`;
    }
    return `Stops in ${formatRemaining(g.sleepTimerSecondsRemaining)} · ${g.sleepTimerSelectMin} min`;
  }, [g]);

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.top}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: appTheme.space.screenPadding }]}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          icon="volume-up"
          title="Sound"
          subtitle="Ambient, meditation & library"
        />

        <View style={styles.card}>
          <LabeledSlider
            label="Volume"
            value={g.volume}
            min={0}
            max={1}
            step={0.01}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onValueChange={(v) => g.setVolume(v)}
          />
          <LabeledSlider
            label="Sleep timer"
            value={g.sleepTimerSelectMin}
            min={0}
            max={120}
            step={5}
            formatValue={(m) => (m === 0 ? "Off" : `${m} min`)}
            onValueChange={(m) => g.setSleepTimerSelectMin(m)}
          />
          <Text style={styles.timerStatus}>{timerLine}</Text>
          {g.source === "spotify" && g.sleepTimerSelectMin > 0 ? (
            <Text style={styles.mutedNote}>
              Timer does not stop Spotify. End playback in the Spotify app.
            </Text>
          ) : null}
        </View>

        <View style={styles.bluetooth}>
          <FontAwesome name="bluetooth" size={16} color={appTheme.colors.accent} />
          <Text style={styles.bluetoothT}>Connected to SleepMask</Text>
        </View>

        {nowPlaying ? (
          <View style={styles.np}>
            <Text style={styles.npLabel}>Now playing</Text>
            <Text style={styles.npTitle} numberOfLines={1}>
              {g.currentTrack}
            </Text>
            <Text style={styles.npSource}>
              {g.source === "spotify"
                ? "Spotify"
                : g.source === "meditation"
                  ? "Meditation"
                  : g.source === "ambient"
                    ? "Ambient"
                    : ""}
            </Text>
            <View style={styles.npRow}>
              <Pressable
                onPress={async () => {
                  if (g.isPlaying) {
                    await g.pause();
                  } else {
                    await g.resume();
                  }
                }}
                style={styles.npBtn}
                hitSlop={8}
              >
                <FontAwesome
                  name={g.isPlaying ? "pause" : "play"}
                  size={22}
                  color={appTheme.colors.accent}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  void g.stop();
                }}
                style={styles.npBtn}
                hitSlop={8}
              >
                <FontAwesome
                  name="stop"
                  size={20}
                  color={appTheme.colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.tabs}>
          {(
            [
              { id: "ambient" as const, label: "Ambient" },
              { id: "meditation" as const, label: "Meditation" },
              { id: "library" as const, label: "Library" },
            ] as const
          ).map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, tab === t.id && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "library" ? (
          <View style={styles.tabBody}>
            <SpotifyLibraryTab />
          </View>
        ) : (
          <View style={styles.tabBody}>
            {(tab === "ambient" ? AMBIENT_TRACKS : MEDITATION_TRACKS).map((row) => {
              const isCurrent = g.currentTrackId === row.id;
              const playing = isCurrent && g.isPlaying;
              return (
                <Pressable
                  key={row.id}
                  onPress={() => {
                    void g.toggleLocalForTrack({
                      id: row.id,
                      title: row.title,
                      file: row.file,
                      loop: row.loop,
                      source: row.source,
                    });
                  }}
                  style={[styles.row, isCurrent && styles.rowOn]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowSub}>{row.sub}</Text>
                  </View>
                  <View style={styles.pillRow}>
                    <Text style={styles.pillGlyph}>
                      {isCurrent && playing ? "⏸" : "▶"}
                    </Text>
                    <Text style={styles.pillText}>
                      {isCurrent && (g.isPlaying || g.isPaused)
                        ? g.isPlaying
                          ? "Pause"
                          : "Play"
                        : "Play"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {g.lastError ? <Text style={styles.err}>Error: {g.lastError}</Text> : null}
        <View style={styles.spacer} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: appTheme.space.sm, flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: 40 },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.cardPadding,
    marginBottom: appTheme.space.md,
  },
  timerStatus: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    color: appTheme.colors.textSecondary,
    marginTop: 4,
  },
  mutedNote: {
    marginTop: 6,
    fontSize: 12,
    color: appTheme.colors.textMuted,
  },
  bluetooth: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: appTheme.space.lg,
  },
  bluetoothT: {
    color: appTheme.colors.textSecondary,
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
  },
  np: {
    backgroundColor: appTheme.colors.surfaceRow,
    borderWidth: 1,
    borderColor: appTheme.colors.accentBorderSoft,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.lg,
    marginBottom: appTheme.space.lg,
  },
  npLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    color: appTheme.colors.textMuted,
    marginBottom: 4,
  },
  npTitle: { fontFamily: appTheme.fonts.medium, color: appTheme.colors.text, fontSize: 18 },
  npSource: { color: appTheme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  npRow: { flexDirection: "row", gap: 20, marginTop: 12 },
  npBtn: { padding: 4 },
  tabs: {
    flexDirection: "row",
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: 4,
    gap: 4,
    marginBottom: appTheme.space.lg,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: appTheme.radii.sm, alignItems: "center" },
  tabOn: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  tabText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.label,
    color: appTheme.colors.textMuted,
  },
  tabTextOn: { color: appTheme.colors.text },
  tabBody: { minHeight: 120 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    marginBottom: 10,
  },
  rowOn: { borderColor: appTheme.colors.accent },
  rowLeft: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: appTheme.fonts.medium, color: appTheme.colors.text, fontSize: 16 },
  rowSub: { color: appTheme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pillGlyph: { color: appTheme.colors.accent, fontSize: 16 },
  pillText: { fontSize: 13, color: appTheme.colors.textSecondary },
  err: { color: appTheme.colors.warningText, marginTop: 8 },
  spacer: { height: 24 },
});
