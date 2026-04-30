import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { SpotifyLibraryTab } from "@/components/sound/SpotifyLibraryTab";
import { AMBIENT_TRACKS, MEDITATION_TRACKS } from "@/components/sound/soundTracks";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

type Tab = "ambient" | "meditation" | "library";

function timerLabel(min: number) {
  if (min <= 0) return "Off";
  return `${min} min`;
}

export default function SoundScreen() {
  const audio = useGlobalAudio();
  const [tab, setTab] = useState<Tab>("ambient");

  useFocusEffect(
    useCallback(() => {
      void audio.refreshSpotifyPlaybackDisplay();
    }, [audio.refreshSpotifyPlaybackDisplay])
  );
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
        style={styles.scrollView}
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
            formatValue={(m) => timerLabel(m)}
            onValueChange={audio.setSleepTimerSelectMin}
          />
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab("ambient")}
            style={[styles.tab, tab === "ambient" && styles.tabOn]}
          >
            <Text style={styles.tabText}>Ambient Sounds</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("meditation")}
            style={[styles.tab, tab === "meditation" && styles.tabOn]}
          >
            <Text style={styles.tabText}>Meditation</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("library")}
            style={[styles.tab, tab === "library" && styles.tabOn]}
          >
            <Text style={styles.tabText}>Spotify</Text>
          </Pressable>
        </View>

        {audio.currentTrack ? (
          <View style={styles.nowPlaying}>
            <Text style={styles.nowLabel}>Now Playing</Text>
            <Text style={styles.nowTrack}>{audio.currentTrack}</Text>
            <Text style={styles.nowSource}>{sourceLabel}</Text>
            <View style={styles.controlsRow}>
              <View style={[styles.controlsSide, styles.controlsSideLeft]}>
                {audio.source === "spotify" ? (
                  <Pressable
                    style={styles.ctrlHit}
                    onPress={() => void audio.spotifySkipPrevious()}
                    hitSlop={8}
                  >
                    <Text style={styles.ctrlText}>Previous</Text>
                  </Pressable>
                ) : (
                  <View style={styles.ctrlHit} />
                )}
              </View>
              <View style={styles.controlsCenterCluster}>
                <Pressable
                  style={styles.ctrlHit}
                  onPress={() => void (audio.isPlaying ? audio.pause() : audio.resume())}
                  hitSlop={8}
                >
                  <Text style={styles.ctrlText}>{audio.isPlaying ? "Pause" : "Play"}</Text>
                </Pressable>
                <Pressable style={styles.ctrlHit} onPress={() => void audio.stop()} hitSlop={8}>
                  <Text style={styles.ctrlText}>Stop</Text>
                </Pressable>
              </View>
              <View style={[styles.controlsSide, styles.controlsSideRight]}>
                {audio.source === "spotify" ? (
                  <Pressable
                    style={styles.ctrlHit}
                    onPress={() => void audio.spotifySkipNext()}
                    hitSlop={8}
                  >
                    <Text style={styles.ctrlText}>Next</Text>
                  </Pressable>
                ) : (
                  <View style={styles.ctrlHit} />
                )}
              </View>
            </View>
          </View>
        ) : null}

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

        <Text style={styles.bluetoothStatus}>Connected to Sleep Mask</Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
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
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
    textAlign: "center",
    width: "100%",
  },
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
    marginBottom: 16,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  nowLabel: {
    color: appTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    alignSelf: "stretch",
  },
  nowTrack: {
    color: appTheme.colors.text,
    marginTop: 4,
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
    textAlign: "center",
    alignSelf: "stretch",
  },
  nowSource: {
    marginTop: 3,
    color: appTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    alignSelf: "stretch",
  },
  controlsRow: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlsSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  controlsSideLeft: { justifyContent: "flex-start" },
  controlsSideRight: { justifyContent: "flex-end" },
  controlsCenterCluster: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    flexShrink: 0,
    minHeight: 44,
  },
  ctrlHit: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  ctrlText: { color: appTheme.colors.accent, fontFamily: appTheme.fonts.medium, fontSize: 14 },
  bluetoothStatus: {
    marginTop: 14,
    color: appTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
});
