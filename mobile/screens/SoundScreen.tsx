import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  AmbientTrackRow,
  type AmbientTrack,
} from "@/components/sound/AmbientTrackRow";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import {
  SoundSourceTabs,
  type SoundSourceTab,
} from "@/components/sound/SoundSourceTabs";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { sendAudioCommand } from "@/hooks/mqttClient";
import { useMaskMqtt } from "@/providers/MaskMqttContext";
import { appTheme } from "@/theme/appTheme";

const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: "1", emoji: "🌧️", title: "Rain Sounds", subtitle: "Gentle rainfall" },
  { id: "2", emoji: "🌊", title: "Ocean Waves", subtitle: "Calming seaside" },
  { id: "3", emoji: "🌲", title: "Forest Night", subtitle: "Nature ambience" },
  { id: "4", emoji: "🔥", title: "Crackling Fire", subtitle: "Warm fireplace" },
  { id: "5", emoji: "🌙", title: "White Noise", subtitle: "Consistent sound" },
];

const DEBOUNCE_MS = 400;

export default function SoundScreen() {
  const { maskAudio } = useMaskMqtt();
  const [tab, setTab] = useState<SoundSourceTab>("ambient");
  const [volume, setVolume] = useState(0.45);
  const [sleepTimerMin, setSleepTimerMin] = useState(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!maskAudio) return;
    setCommandFeedback(
      `Device reported: ${maskAudio.state}${maskAudio.trackId ? ` • ${maskAudio.trackId}` : ""}`
    );
  }, [maskAudio]);

  const volumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publishVolume = useCallback((level: number) => {
    sendAudioCommand("audio.set_volume", { level });
  }, []);

  const publishSleepTimer = useCallback((seconds: number) => {
    sendAudioCommand("audio.sleep_timer", { seconds });
  }, []);

  const scheduleVolumePublish = useCallback(
    (level: number) => {
      if (volumeDebounceRef.current) {
        clearTimeout(volumeDebounceRef.current);
      }
      volumeDebounceRef.current = setTimeout(() => {
        publishVolume(level);
        volumeDebounceRef.current = null;
      }, DEBOUNCE_MS);
    },
    [publishVolume]
  );

  const scheduleTimerPublish = useCallback(
    (minutes: number) => {
      if (timerDebounceRef.current) {
        clearTimeout(timerDebounceRef.current);
      }
      timerDebounceRef.current = setTimeout(() => {
        publishSleepTimer(minutes * 60);
        timerDebounceRef.current = null;
      }, DEBOUNCE_MS);
    },
    [publishSleepTimer]
  );

  const loadTrack = (id: string) => {
    setSelectedId(id);
    sendAudioCommand("audio.load", {
      trackId: `ambient-${id}`,
      url: "https://example.com/placeholder.mp3",
      codecHint: "mp3_cbr_128_mono",
    });
    setCommandFeedback(`Sent load • ambient-${id} (MQTT)`);
  };

  const togglePlayback = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      sendAudioCommand("audio.pause", { trackId: `ambient-${id}` });
      setCommandFeedback(`Sent pause • ambient-${id} (MQTT)`);
      return;
    }
    if (selectedId !== id) {
      loadTrack(id);
    }
    setPlayingId(id);
    sendAudioCommand("audio.play", { trackId: `ambient-${id}` });
    setCommandFeedback(`Sent play • ambient-${id} (MQTT)`);
  };

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <ScreenHeader
        icon="music"
        title="Ambient Sounds"
        subtitle="Relaxing audio for better sleep"
      />

      <View style={styles.controlCard}>
        <LabeledSlider
          label="Volume"
          value={volume}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onValueChange={(v) => {
            setVolume(v);
            scheduleVolumePublish(v);
          }}
          onSlidingComplete={(v) => {
            if (volumeDebounceRef.current) {
              clearTimeout(volumeDebounceRef.current);
              volumeDebounceRef.current = null;
            }
            publishVolume(v);
          }}
        />

        <LabeledSlider
          label="Sleep timer"
          value={sleepTimerMin}
          min={0}
          max={120}
          step={5}
          formatValue={(m) => (m === 0 ? "Off" : `${Math.round(m)} min`)}
          onValueChange={(m) => {
            setSleepTimerMin(m);
            scheduleTimerPublish(m);
          }}
          onSlidingComplete={(m) => {
            if (timerDebounceRef.current) {
              clearTimeout(timerDebounceRef.current);
              timerDebounceRef.current = null;
            }
            publishSleepTimer(m * 60);
          }}
        />
      </View>

      <SoundSourceTabs active={tab} onChange={setTab} />

      {commandFeedback ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{commandFeedback}</Text>
        </View>
      ) : null}

      {tab === "ambient" ? (
        <View style={styles.listBlock}>
          {AMBIENT_TRACKS.map((track) => (
            <AmbientTrackRow
              key={track.id}
              track={track}
              playing={playingId === track.id}
              onPressRow={() => loadTrack(track.id)}
              onPressPlay={() => togglePlayback(track.id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.spotifyCard}>
          <Text style={styles.spotifyTitle}>Spotify (preview)</Text>
          <Text style={styles.spotifyBody}>
            Figma Make includes Spotify browse UI. v1 firmware uses HTTPS URLs
            (`audio.load`); native Spotify SDK would be a separate product scope
            (auth, streaming, Expo config).
          </Text>
          <Text style={styles.spotifyHint}>
            Use Ambient Sounds for mask playback experiments today.
          </Text>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: appTheme.space.sm,
  },
  feedbackBox: {
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: appTheme.space.md,
    marginBottom: appTheme.space.md,
  },
  feedbackText: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textSecondary,
  },
  controlCard: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.cardPadding,
    marginBottom: appTheme.space.md,
  },
  listBlock: {
    paddingBottom: appTheme.space.xl,
  },
  spotifyCard: {
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: appTheme.space.cardPadding,
    gap: 10,
    marginBottom: appTheme.space.xxl,
  },
  spotifyTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    color: appTheme.colors.text,
  },
  spotifyBody: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
  spotifyHint: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textMuted,
  },
});
