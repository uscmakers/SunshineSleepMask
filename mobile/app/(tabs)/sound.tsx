import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { SpotifyLibraryTab } from "@/components/sound/SpotifyLibraryTab";
import { AMBIENT_TRACKS, MEDITATION_TRACKS } from "@/components/sound/soundTracks";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

type Tab = "ambient" | "meditation" | "library";

function timerLabel(min: number, source: string) {
  if (min <= 0) return "Off";
  if (source === "spotify") return `${min} min (Spotify unmanaged)`;
  return `${min} min`;
}

export default function SoundScreen() {
  const audio = useGlobalAudio();
  const [tab, setTab] = useState<Tab>("ambient");
  const sourceLabel =
    audio.source === "ambient"
      ? "Ambient"
      : audio.source === "meditation"
        ? "Meditation"
        : audio.source === "spotify"
          ? "Spotify"
          : "Idle";

  const rows = useMemo(
    () => (tab === "ambient" ? AMBIENT_TRACKS : MEDITATION_TRACKS),
    [tab]
  );

  return (
    <AppScreen scroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          icon="music"
          title="Sounds"
          subtitle="Choose sounds and music to help you sleep"
        />

        <View style={styles.sliderCard}>
          <LabeledSlider
            label="Volume"
            value={audio.volume}
            min={0}
            max={1}
            step={0.01}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onValueChange={audio.setVolume}
          />
          <LabeledSlider
            label="Sleep Timer"
            value={audio.sleepTimerSelectMin}
            min={0}
            max={120}
            step={5}
            formatValue={(m) => timerLabel(m, audio.source)}
            onValueChange={audio.setSleepTimerSelectMin}
          />
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab("ambient")}
            style={[styles.tab, tab === "ambient" && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === "ambient" && styles.tabTextOn]}>
              Ambient Sounds
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("meditation")}
            style={[styles.tab, tab === "meditation" && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === "meditation" && styles.tabTextOn]}>
              Meditation
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("library")}
            style={[styles.tab, tab === "library" && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === "library" && styles.tabTextOn]}>
              Spotify
            </Text>
          </Pressable>
        </View>

        {tab === "library" ? (
          <SpotifyLibraryTab />
        ) : (
          <View style={styles.rows}>
            {rows.map((row) => {
              const current = audio.currentTrackId === row.id;
              const playing = current && audio.isPlaying;
              return (
                <Pressable
                  key={row.id}
                  onPress={() => {
                    void audio.toggleLocalForTrack(row);
                  }}
                  style={[styles.row, current && styles.rowOn]}
                >
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <View style={styles.playBtn}>
                    <FontAwesome
                      name={playing ? "pause" : "play"}
                      size={16}
                      color={playing ? appTheme.colors.accent : appTheme.colors.textSecondary}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {audio.currentTrack ? (
          <View style={styles.nowPlaying}>
            <Text style={styles.nowLabel}>Now Playing</Text>
            <Text style={styles.nowTrack}>{audio.currentTrack}</Text>
            <Text style={styles.nowSource}>{sourceLabel}</Text>
            <View style={styles.controls}>
              <Pressable onPress={() => void (audio.isPlaying ? audio.pause() : audio.resume())}>
                <Text style={styles.ctrlText}>{audio.isPlaying ? "Pause" : "Play"}</Text>
              </Pressable>
              <Pressable onPress={() => void audio.stop()}>
                <Text style={styles.ctrlText}>Stop</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.bluetoothStatus}>Connected to SleepMask</Text>
        {audio.source === "spotify" && audio.sleepTimerSelectMin > 0 ? (
          <Text style={styles.timerHint}>Sleep timer does not control Spotify playback</Text>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: appTheme.space.screenPadding,
    paddingBottom: 80,
  },
  sliderCard: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: appTheme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 4,
    gap: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabOn: {
    backgroundColor: appTheme.colors.accentTint,
    borderWidth: 1,
    borderColor: appTheme.colors.accentBorderSoft,
  },
  tabText: {
    color: appTheme.colors.textSecondary,
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
  },
  tabTextOn: { color: appTheme.colors.accent },
  rows: { gap: 12 },
  row: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    minHeight: 72,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowOn: { borderColor: appTheme.colors.accentBorderSoft },
  rowTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
    fontSize: 32 / 2,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surfaceRow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  nowPlaying: {
    marginTop: 24,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    padding: 16,
  },
  nowLabel: { color: appTheme.colors.textSecondary, fontSize: 12 },
  nowTrack: {
    color: appTheme.colors.text,
    marginTop: 4,
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
  },
  nowSource: { marginTop: 3, color: appTheme.colors.textSecondary, fontSize: 12 },
  controls: { marginTop: 10, flexDirection: "row", gap: 20 },
  ctrlText: { color: appTheme.colors.accent, fontFamily: appTheme.fonts.medium, fontSize: 14 },
  bluetoothStatus: {
    marginTop: 14,
    color: appTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  timerHint: { marginTop: 10, color: appTheme.colors.textMuted, textAlign: "center", fontSize: 12 },
});
