import Constants from "expo-constants";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatTime, useAlarmContext } from "@/alarm/AlarmContext";
import { useGlobalAudio } from "@/audio/GlobalAudioContext";
import { DeviceConnectionCard } from "@/components/home/DeviceConnectionCard";
import { MaskShowcaseCard } from "@/components/home/MaskShowcaseCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { initMqtt, subscribeMqttConnection } from "@/hooks/mqttClient";
import { appTheme } from "@/theme/appTheme";

export default function HomeScreen() {
  const audio = useGlobalAudio();
  const { getNextScheduledAlarm } = useAlarmContext();
  const [scheduleTick, setScheduleTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setScheduleTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const nextScheduled = useMemo(() => {
    void scheduleTick;
    return getNextScheduledAlarm();
  }, [getNextScheduledAlarm, scheduleTick]);
  const tokenOk = Boolean(Constants.expoConfig?.extra?.flespiToken);
  const deviceId =
    (Constants.expoConfig?.extra?.deviceId as string | undefined) ?? "sleepmask";
  const [mqttConnected, setMqttConnected] = useState(false);

  useEffect(() => {
    if (!tokenOk) return;
    initMqtt();
    return subscribeMqttConnection(({ connected }) => setMqttConnected(connected));
  }, [tokenOk]);

  const statusTitle = !tokenOk ? "Setup required" : mqttConnected ? "Connected" : "Not connected";
  const statusSubtitle = !tokenOk
    ? "Add FLESPI_TOKEN in .env"
    : mqttConnected
      ? `Connected to SleepMask #${deviceId === "sleepmask" ? "1234" : deviceId}`
      : "Waiting for heartbeat/status";
  const sourceLabel = useMemo(() => {
    if (audio.source === "ambient") return "Ambient";
    if (audio.source === "meditation") return "Meditation";
    if (audio.source === "spotify") return "Spotify";
    return "Idle";
  }, [audio.source]);

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Sunshine Sleep Mask</Text>
        <Text style={styles.subtitle}>Your personal sleep companion</Text>
      </View>

      <View style={styles.stack}>
        <DeviceConnectionCard
          statusTitle={statusTitle}
          statusSubtitle={statusSubtitle}
          batteryPercent="85%"
          connected={tokenOk && mqttConnected}
        />
        <MaskShowcaseCard />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Next Alarm</Text>
          <Text style={styles.cardTitle}>
            {nextScheduled ? formatTime(nextScheduled.occursAt) : "No alarm enabled"}
          </Text>
          <Text style={styles.cardSub}>
            {nextScheduled
              ? `${nextScheduled.alarm.label} · next ring`
              : "Enable an alarm on the Alarm tab"}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Now Playing</Text>
          <Text style={styles.cardTitle}>{audio.currentTrack ?? "Nothing playing"}</Text>
          <Text style={styles.cardSub}>{sourceLabel}</Text>
          {audio.currentTrack ? (
            <View style={styles.controls}>
              <Pressable onPress={() => void (audio.isPlaying ? audio.pause() : audio.resume())}>
                <Text style={styles.controlBtn}>{audio.isPlaying ? "Pause" : "Play"}</Text>
              </Pressable>
              <Pressable onPress={() => void audio.stop()}>
                <Text style={styles.controlBtn}>Stop</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <Link href="/modal" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>About</Text>
        </Pressable>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: appTheme.space.lg },
  header: {
    alignItems: "center",
    paddingTop: 4,
    marginBottom: appTheme.space.sectionGap,
  },
  heroTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.heroTitle,
    lineHeight: appTheme.type.heroTitleLine,
    color: appTheme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.subtitle,
    lineHeight: appTheme.type.subtitleLine,
    color: appTheme.colors.textSecondary,
    textAlign: "center",
  },
  stack: { gap: 24 },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    padding: 16,
  },
  cardLabel: { color: appTheme.colors.textSecondary, fontSize: 12, fontFamily: appTheme.fonts.medium },
  cardTitle: {
    marginTop: 4,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
    fontSize: 18,
  },
  cardSub: { marginTop: 4, color: appTheme.colors.textSecondary, fontSize: 13 },
  controls: { marginTop: 10, flexDirection: "row", gap: 18 },
  controlBtn: { color: appTheme.colors.accent, fontFamily: appTheme.fonts.medium, fontSize: 14 },
  link: { marginTop: appTheme.space.xxl, paddingVertical: 6, alignSelf: "center" },
  linkText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 15,
    color: appTheme.colors.accent,
  },
});
