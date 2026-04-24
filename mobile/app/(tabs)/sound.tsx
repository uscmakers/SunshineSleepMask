import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useMemo, useState, useRef, useEffect } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { SpotifyLibraryTab } from "@/components/sound/SpotifyLibraryTab";
import { AMBIENT_TRACKS, MEDITATION_TRACKS } from "@/components/sound/soundTracks";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

type Tab = "ambient" | "meditation" | "library";

function formatRemaining(sec: number) {
  if (sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type AudioItem = {
  id: string;
  title: string;
  file: number | { uri: string };
  isUserUpload?: boolean;
};

/* `createAudioPlayer` is not auto-managed; call `release()` to
detach native resources (Expo SharedObject). */
function releaseAudioPlayer(player: AudioPlayer | null | undefined) {
  if (!player) return;
  try {
    player.pause();
  } catch {
    // ignore if already torn down
  }
  try {
    player.release();
  } catch {
    // ignore double-release
  }
}

const BUILT_IN_AUDIO: AudioItem[] = [
  {
    id: "1",
    title: "Rain Sounds",
    file: require("../../assets/audio/rain-sounds.mp3"),
  },
  {
    id: "2",
    title: "Brown Noise",
    file: require("../../assets/audio/brown-noise.mp3"),
  },
];

export default function SoundScreen() {
  const g = useGlobalAudio();
  const [tab, setTab] = useState<Tab>("ambient");

  const [audioData, setAudioData] = useState<AudioItem[]>(BUILT_IN_AUDIO);
  const playerRef = useRef<AudioPlayer | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      const p = playerRef.current;
      playerRef.current = null;
      releaseAudioPlayer(p);
    };
  }, []);

  const stopCurrentPlayer = () => {
    const p = playerRef.current;
    playerRef.current = null;
    releaseAudioPlayer(p);
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "video/mp4", "audio/mp4"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      const newItem: AudioItem = {
        id: `upload-${Date.now()}`,
        title: asset.name ?? "Uploaded Audio",
        file: { uri: asset.uri },
        isUserUpload: true,
      };

      setAudioData((prev) => [...prev, newItem]);
    } catch (error) {
      console.error("Error picking audio file:", error);
    }
  };

  const playSound = (item: AudioItem) => {
    try {
      if (currentId === item.id && playerRef.current) {
        if (isPlaying) {
          playerRef.current.pause();
          setIsPlaying(false);
        } else {
          playerRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      stopCurrentPlayer();

      const player = createAudioPlayer(item.file);
      player.loop = true;
      player.play();

      playerRef.current = player;
      setCurrentId(item.id);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  // unified data source
  const listData = useMemo(() => {
    if (tab === "library") return audioData;
    return tab === "ambient" ? AMBIENT_TRACKS : MEDITATION_TRACKS;
  }, [tab, audioData]);

  // unified renderer
  const renderItem = ({ item }: any) => {
    if (tab === "library") {
      const isActive = currentId === item.id;

      return (
        <TouchableOpacity
          style={[styles.card, isActive && styles.activeCard]}
          onPress={() => playSound(item)}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.status}>
            {isActive ? (isPlaying ? "Playing" : "Paused") : "Tap to play"}
          </Text>
          {item.isUserUpload && <Text style={styles.badge}>Uploaded</Text>}
        </TouchableOpacity>
      );
    }

    const isCurrent = g.currentTrackId === item.id;
    const playing = isCurrent && g.isPlaying;

    return (
      <Pressable
        onPress={() =>
          g.toggleLocalForTrack({
            id: item.id,
            title: item.title,
            file: item.file,
            loop: item.loop,
            source: item.source,
          })
        }
        style={[styles.row, isCurrent && styles.rowOn]}
      >
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowSub}>{item.sub}</Text>
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
  };

  const nowPlaying = g.currentTrack && g.source !== "idle";

  return (
    <AppScreen scroll={false}>
      <FlatList
        data={listData}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: appTheme.space.screenPadding,
          paddingBottom: 80,
        }}

        
        ListHeaderComponent={
          <>
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
            </View>

            <View style={styles.tabs}>
              {["ambient", "meditation", "library"].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t as Tab)}
                  style={[styles.tab, tab === t && styles.tabOn]}
                >
                  <Text style={styles.tabText}>{t}</Text>
                </Pressable>
              ))}
            </View>

            {/* 🔥 Library-only header content */}
            {tab === "library" && (
              <>
                <SpotifyLibraryTab />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickAudioFile}
                >
                  <Text style={styles.uploadButtonText}>
                    Upload your own audio
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        }
      />
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
  uploadButton: {
    backgroundColor: "#324376",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  activeCard: {
    backgroundColor: "#2e3b6b",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  status: {
    color: "#aab",
    marginTop: 6,
  },
  badge: {
    color: "#c7d2fe",
    marginTop: 8,
    fontSize: 12,
  },
});
