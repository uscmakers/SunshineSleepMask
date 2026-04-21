import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TrackRow, type LibraryTrack } from "@/components/sound/TrackRow";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { AppScreen } from "@/components/ui/AppScreen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sendAudioCommand } from "@/hooks/mqttClient";
import { appTheme } from "@/theme/appTheme";

const AMBIENT: LibraryTrack[] = [
  { id: "1", title: "Rain", subtitle: "Ambient" },
  { id: "2", title: "Ocean", subtitle: "Ambient" },
  { id: "3", title: "Forest night", subtitle: "Ambient" },
];

const GUIDED: LibraryTrack[] = [
  { id: "4", title: "Body scan (short)", subtitle: "Guided" },
];

const SECTIONS: { title: string; data: LibraryTrack[] }[] = [
  { title: "Ambient", data: AMBIENT },
  { title: "Guided", data: GUIDED },
];

const DEBOUNCE_MS = 400;

export default function SoundScreen() {
  const [volume, setVolume] = useState(0.45);
  const [sleepTimerMin, setSleepTimerMin] = useState(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <Text style={styles.title}>Sounds</Text>
      <SectionHeader
        title="Mask playback"
        hint="Volume and sleep timer map to MQTT v1 audio commands once firmware implements playback."
      />

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
        max={180}
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

      <Text style={styles.section}>Library</Text>
      <View style={styles.sections}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.data.map((item) => {
              const active = item.id === selectedId;
              return (
                <TrackRow
                  key={item.id}
                  track={item}
                  active={active}
                  onPress={() => {
                    setSelectedId(item.id);
                    sendAudioCommand("audio.load", {
                      trackId: `placeholder-${item.id}`,
                      url: "https://example.com/placeholder.mp3",
                      codecHint: "mp3_cbr_128_mono",
                    });
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: appTheme.space.sm,
  },
  title: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.screenTitle,
    lineHeight: appTheme.type.screenTitleLine,
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  section: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.text,
    fontSize: appTheme.type.rowTitle,
    lineHeight: appTheme.type.rowTitleLine,
    marginTop: appTheme.space.md,
    marginBottom: appTheme.space.sm,
  },
  sectionLabel: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textMuted,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionBlock: {
    marginBottom: appTheme.space.lg,
  },
  sections: {
    paddingBottom: appTheme.space.xl,
  },
});
