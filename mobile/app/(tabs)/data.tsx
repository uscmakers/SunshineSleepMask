import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

const METRICS = [
  { label: "Total Sleep", value: "7.5h", sub: "7-9h goal", bg: "#0891B2" },
  { label: "Recovery", value: "2.2h", sub: "deep sleep", bg: "#0891B2" },
  { label: "Interruptions", value: "18 min", sub: "awake time", bg: "#FACC15" },
  { label: "Avg Heart Rate", value: "58 bpm", sub: "sleeping", bg: "#0891B2" },
  { label: "Lowest HR", value: "51 bpm", sub: "resting", bg: "#0891B2" },
];

const STAGES = [
  { label: "Deep", value: "2.2h", color: "#14B8A6" },
  { label: "Core", value: "3.2h", color: "#0D9488" },
  { label: "REM", value: "1.8h", color: "#5EEAD4" },
  { label: "Awake", value: "18m", color: "#3F3F46" },
];

export default function DataScreen() {
  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <ScreenHeader
        icon="bar-chart"
        title="Sleep Data"
        subtitle="Last night · 10:00 PM - 6:00 AM"
      />
      <Text style={styles.demoBadge}>Demo Data</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metricsRow}
      >
        {METRICS.map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: m.bg }]}>
            <Text style={styles.metricLabel}>{m.label} · Demo Data</Text>
            <View style={styles.metricBottom}>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricSub}>{m.sub}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.stageCard}>
        <View style={styles.stageHead}>
          <Text style={styles.stageTitle}>Sleep Stages · Demo Data</Text>
          <Text style={styles.detail}>Details ›</Text>
        </View>

        <View style={styles.segmentTrack}>
          <View style={[styles.segment, { flex: 22, backgroundColor: "#5EEAD4" }]} />
          <View style={[styles.segment, { flex: 32, backgroundColor: "#0D9488" }]} />
          <View style={[styles.segment, { flex: 18, backgroundColor: "#14B8A6" }]} />
          <View style={[styles.segment, { flex: 18, backgroundColor: "#0F766E" }]} />
          <View style={[styles.segment, { flex: 10, backgroundColor: "#3F3F46" }]} />
        </View>

        <View style={styles.legend}>
          {STAGES.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>{s.label}</Text>
              <Text style={styles.legendValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.placeholderNote}>
          Placeholder data shown. TODO: wire to HealthKit/device export once source is defined.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: appTheme.space.sm },
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
