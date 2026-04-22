import Constants from "expo-constants";
import { Link } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { scheduleOnRN } from "react-native-worklets";

import { CurrentSettingsCard } from "@/components/home/CurrentSettingsCard";
import { DeviceConnectionCard } from "@/components/home/DeviceConnectionCard";
import { MaskShowcaseCard } from "@/components/home/MaskShowcaseCard";
import { SleepSummaryCard } from "@/components/home/SleepSummaryCard";
import { WakeLightCard } from "@/components/home/WakeLightCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { initMqtt, sendColor } from "@/hooks/mqttClient";
import { appTheme } from "@/theme/appTheme";

const THROTTLE_INTERVAL_MS = 150;

export default function HomeScreen() {
  const lastSentTimeRef = useRef(0);
  const pendingColorRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokenOk = Boolean(Constants.expoConfig?.extra?.flespiToken);
  const deviceId =
    (Constants.expoConfig?.extra?.deviceId as string | undefined) ?? "sleepmask";

  const statusTitle = !tokenOk ? "Setup required" : "Your mask";
  const statusSubtitle = !tokenOk
    ? "Add FLESPI_TOKEN in .env"
    : `Device #${deviceId}`;

  useEffect(() => {
    initMqtt();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const throttledSendColor = (hex: string) => {
    pendingColorRef.current = hex;
    const now = Date.now();
    if (now - lastSentTimeRef.current >= THROTTLE_INTERVAL_MS) {
      lastSentTimeRef.current = now;
      if (pendingColorRef.current) {
        sendColor(pendingColorRef.current);
        pendingColorRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const rem = THROTTLE_INTERVAL_MS - (now - lastSentTimeRef.current);
      timeoutRef.current = setTimeout(() => {
        if (pendingColorRef.current) {
          lastSentTimeRef.current = Date.now();
          sendColor(pendingColorRef.current);
          pendingColorRef.current = null;
        }
        timeoutRef.current = null;
      }, rem);
    }
  };

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
          batteryPercent="—"
          connected={tokenOk}
        />
        <MaskShowcaseCard />
        <CurrentSettingsCard
          nextAlarmLine="7:00 AM · Weekdays (example)"
          activeSoundLine="Rain · 30 min timer (example)"
          nightModeLine="On · low brightness (example)"
        />
        <SleepSummaryCard />
        <WakeLightCard onColorPicked={throttledSendColor} />
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
  stack: { gap: appTheme.space.sectionGap },
  link: { marginTop: appTheme.space.xxl, paddingVertical: 6, alignSelf: "center" },
  linkText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 15,
    color: appTheme.colors.accent,
  },
});
