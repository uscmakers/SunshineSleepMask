import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { loadLastNightSleep, requestSleepAccess } from "@/health/sleepHealthKit";
import type { SleepLoadResult, SleepNightSummary } from "@/health/sleepHealthKit.types";
import { appTheme } from "@/theme/appTheme";

function formatHoursShort(h: number): string {
  if (h <= 0) return "—";
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}

function formatBpm(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n)} bpm`;
}

function buildMetricsFromHealth(data: SleepNightSummary) {
  const goalSub = "7–9h goal";
  return [
    {
      label: "Total Sleep",
      value: formatHoursShort(data.totalSleepHours),
      sub: goalSub,
      bg: "#0891B2",
    },
    {
      label: "Deep Sleep",
      value: formatHoursShort(data.stages.deep),
      sub: "recovery",
      bg: "#0891B2",
    },
    {
      label: "Awake",
      value: formatHoursShort(data.stages.awake),
      sub: "during session",
      bg: "#FACC15",
    },
    {
      label: "Avg Heart Rate",
      value: formatBpm(data.heartRateAvg),
      sub: "while sleeping",
      bg: "#0891B2",
    },
    {
      label: "Lowest HR",
      value: formatBpm(data.heartRateMin),
      sub: "overnight",
      bg: "#0891B2",
    },
  ];
}

const DEMO_METRICS = [
  { label: "Total Sleep", value: "7.5h", sub: "7-9h goal", bg: "#0891B2" },
  { label: "Recovery", value: "2.2h", sub: "deep sleep", bg: "#0891B2" },
  { label: "Interruptions", value: "18 min", sub: "awake time", bg: "#FACC15" },
  { label: "Avg Heart Rate", value: "58 bpm", sub: "sleeping", bg: "#0891B2" },
  { label: "Lowest HR", value: "51 bpm", sub: "resting", bg: "#0891B2" },
];

const DEMO_STAGES = [
  { label: "Deep", value: "2.2h", color: "#14B8A6", flex: 22 },
  { label: "Core", value: "3.2h", color: "#0D9488", flex: 32 },
  { label: "REM", value: "1.8h", color: "#5EEAD4", flex: 18 },
  { label: "Awake", value: "18m", color: "#3F3F46", flex: 10 },
];

export default function DataScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SleepLoadResult | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await loadLastNightSleep();
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const onRequestAccess = useCallback(async () => {
    setLoading(true);
    try {
      const r = await requestSleepAccess();
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, []);

  const healthOk = result?.ok === true;
  const summary = healthOk ? result.data : null;
  const metrics = healthOk && summary ? buildMetricsFromHealth(summary) : DEMO_METRICS;

  const stageRows = (() => {
    if (!summary) return DEMO_STAGES;
    const rows = [
      { label: "Deep", hours: summary.stages.deep, color: "#14B8A6" },
      { label: "Core", hours: summary.stages.core + summary.stages.asleepOther, color: "#0D9488" },
      { label: "REM", hours: summary.stages.rem, color: "#5EEAD4" },
      { label: "Awake", hours: summary.stages.awake, color: "#3F3F46" },
    ];
    const flexes = rows.map((r) => Math.max(1, Math.round(r.hours * 60)));
    const total = flexes.reduce((a, b) => a + b, 0) || 1;
    return rows.map((r, i) => ({
      label: r.label,
      value: formatHoursShort(r.hours),
      color: r.color,
      flex: Math.max(4, Math.round((flexes[i]! / total) * 100)),
    }));
  })();

  const subtitle = summary
    ? summary.windowLabel
    : Platform.OS === "ios"
      ? "Apple Health · last night"
      : "Demo preview";

  const statusBanner = (() => {
    if (loading && !result) {
      return (
        <View style={styles.statusRow}>
          <ActivityIndicator color={appTheme.colors.accent} />
          <Text style={styles.statusText}>Loading sleep data…</Text>
        </View>
      );
    }
    if (!result) return null;
    if (result.ok) return null;
    if (result.reason === "unavailable") {
      return (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{result.message}</Text>
        </View>
      );
    }
    if (result.reason === "needs_auth") {
      return (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Connect Apple Health</Text>
          <Text style={styles.bannerText}>
            Allow read access for Sleep and Heart Rate so last night’s Apple Watch sleep can appear
            here. Requires a development build (not Expo Go).
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => void onRequestAccess()} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Allow Apple Health</Text>
            )}
          </Pressable>
        </View>
      );
    }
    if (result.reason === "denied") {
      return (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Health access denied</Text>
          <Text style={styles.bannerText}>{result.message}</Text>
          <Pressable style={styles.secondaryBtn} onPress={() => void Linking.openSettings()}>
            <Text style={styles.secondaryBtnText}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }
    if (result.reason === "no_data") {
      return (
        <View style={styles.bannerMuted}>
          <Text style={styles.bannerText}>{result.message}</Text>
        </View>
      );
    }
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{result.message ?? "Something went wrong."}</Text>
      </View>
    );
  })();

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <ScreenHeader icon="bar-chart" title="Sleep Data" subtitle={subtitle} />

      {statusBanner}

      {healthOk ? (
        <Text style={styles.sourceBadge}>Apple Health</Text>
      ) : (
        <Text style={styles.demoBadge}>Demo Data</Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metricsRow}
      >
        {metrics.map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: m.bg }]}>
            <Text style={styles.metricLabel}>
              {m.label}
              {!healthOk ? " · Demo" : ""}
            </Text>
            <View style={styles.metricBottom}>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricSub}>{m.sub}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.stageCard}>
        <View style={styles.stageHead}>
          <Text style={styles.stageTitle}>
            Sleep Stages{healthOk ? "" : " · Demo Data"}
          </Text>
          <Text style={styles.detail}>Details ›</Text>
        </View>

        <View style={styles.segmentTrack}>
          {stageRows.map((s) => (
            <View key={s.label} style={[styles.segment, { flex: s.flex, backgroundColor: s.color }]} />
          ))}
        </View>

        <View style={styles.legend}>
          {stageRows.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>{s.label}</Text>
              <Text style={styles.legendValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.placeholderNote}>
          {healthOk
            ? "Totals are from Apple Health sleep analysis for the window shown above. Reopen this tab after waking to refresh."
            : "Placeholder metrics. On iPhone, connect Apple Health to replace this with your Apple Watch sleep."}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: appTheme.space.sm },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusText: {
    color: appTheme.colors.textSecondary,
    fontSize: 14,
    fontFamily: appTheme.fonts.regular,
  },
  banner: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    gap: 10,
  },
  bannerMuted: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: appTheme.colors.surfaceRow,
  },
  bannerTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
  },
  bannerText: {
    color: appTheme.colors.textSecondary,
    fontFamily: appTheme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: appTheme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 180,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.medium,
    fontSize: 15,
  },
  secondaryBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: appTheme.colors.accent,
    fontFamily: appTheme.fonts.medium,
    fontSize: 15,
  },
  demoBadge: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: appTheme.colors.accentTint,
    color: appTheme.colors.accent,
    fontSize: 12,
    fontFamily: appTheme.fonts.medium,
  },
  sourceBadge: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: appTheme.colors.surfaceRow,
    color: appTheme.colors.textSecondary,
    fontSize: 12,
    fontFamily: appTheme.fonts.medium,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  metricsRow: {
    gap: 12,
    paddingBottom: 12,
  },
  metricCard: {
    width: 144,
    height: 144,
    borderRadius: 14,
    padding: 16,
    justifyContent: "space-between",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: appTheme.fonts.medium,
    fontSize: 12,
  },
  metricBottom: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  metricValue: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.medium,
    fontSize: 34 / 1.4,
  },
  metricSub: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: appTheme.fonts.medium,
    fontSize: 12,
  },
  stageCard: {
    marginTop: 20,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    padding: 20,
  },
  stageHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  stageTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
    fontSize: 32 / 2,
  },
  detail: {
    color: appTheme.colors.accent,
    fontFamily: appTheme.fonts.medium,
    fontSize: 28 / 2,
  },
  segmentTrack: {
    height: 42,
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: appTheme.colors.surfaceRow,
  },
  segment: { height: "100%" },
  legend: {
    marginTop: 18,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: {
    width: 54,
    color: appTheme.colors.textSecondary,
    fontFamily: appTheme.fonts.regular,
    fontSize: 14,
  },
  legendValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
    fontSize: 15,
  },
  placeholderNote: {
    marginTop: 14,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.regular,
    fontSize: 12,
  },
});
