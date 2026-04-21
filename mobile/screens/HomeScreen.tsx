import Constants from "expo-constants";
import { Link } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CurrentSettingsCard } from "@/components/home/CurrentSettingsCard";
import { DeviceConnectionCard } from "@/components/home/DeviceConnectionCard";
import { MaskShowcaseCard } from "@/components/home/MaskShowcaseCard";
import { SleepSummaryHomeCard } from "@/components/home/SleepSummaryHomeCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { WarningBanner } from "@/components/ui/WarningBanner";
import { useMaskMqtt } from "@/providers/MaskMqttContext";
import { useWakePreferences } from "@/providers/WakePreferencesContext";
import { appTheme } from "@/theme/appTheme";

export default function HomeScreen() {
  const { brokerConnected, maskReachable, telemetry } = useMaskMqtt();
  const { sunriseRampMinutes } = useWakePreferences();

  const tokenConfigured = Boolean(Constants.expoConfig?.extra?.flespiToken);
  const deviceId =
    (Constants.expoConfig?.extra?.deviceId as string | undefined) ??
    "sleepmask";

  const statusTitle = useMemo(() => {
    if (!tokenConfigured) {
      return "Setup required";
    }
    if (!brokerConnected) {
      return "Disconnected";
    }
    if (maskReachable) {
      return "Connected";
    }
    return "Waiting for device";
  }, [brokerConnected, maskReachable, tokenConfigured]);

  const statusSubtitle = useMemo(() => {
    if (!tokenConfigured) {
      return "Add FLESPI_TOKEN to connect";
    }
    return `Sunshine Mask #${deviceId}`;
  }, [deviceId, tokenConfigured]);

  const nextAlarmLine = `7:00 AM • Gentle Sunrise (${sunriseRampMinutes} min)`;

  return (
    <AppScreen scroll contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Sunshine Sleep Mask</Text>
        <Text style={styles.subtitle}>Your personal sleep companion</Text>
      </View>

      {!tokenConfigured ? (
        <WarningBanner message="Set FLESPI_TOKEN in mobile/.env for MQTT (see app.config.js)." />
      ) : null}

      <View style={styles.stack}>
        <DeviceConnectionCard
          statusTitle={statusTitle}
          statusSubtitle={statusSubtitle}
          batteryPercent={telemetry?.batteryPercent ?? null}
        />
        <MaskShowcaseCard />
        <CurrentSettingsCard
          nextAlarmLine={nextAlarmLine}
          activeSoundLine="Ocean Waves • 30 min timer"
          nightModeLine="Enabled • Low light brightness"
        />
        <SleepSummaryHomeCard />
      </View>

      <Link href="/modal" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>About / info</Text>
        </Pressable>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: appTheme.space.lg,
  },
  header: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 4,
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
  stack: {
    gap: appTheme.space.sectionGap,
  },
  link: {
    marginTop: appTheme.space.xxl,
    paddingVertical: 6,
    alignSelf: "center",
  },
  linkText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 15,
    color: appTheme.colors.accent,
  },
});
