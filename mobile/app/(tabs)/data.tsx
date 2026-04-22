import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

const METRICS: { label: string; value: string }[] = [
  { label: "Time asleep", value: "7h 42m" },
  { label: "Quality", value: "89%" },
  { label: "Deep", value: "1h 52m" },
  { label: "REM", value: "1h 48m" },
];

const WEEK = [7.5, 8, 6.5, 7, 8.2, 9, 7.8];
const LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function DataScreen() {
  const maxH = Math.max(...WEEK);

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <View style={styles.demoBanner}>
        <Text style={styles.demoText}>
          Demo data — connect HealthKit or device export for live charts.
        </Text>
      </View>

      <ScreenHeader
        icon="bar-chart"
        title="Sleep data"
        subtitle="Track patterns and quality"
      />

      <View style={styles.grid}>
        {METRICS.map((m) => (
          <View key={m.label} style={styles.tile}>
            <Text style={styles.tileLabel}>{m.label}</Text>
            <Text style={styles.tileValue}>{m.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.chartTitle}>Weekly sleep (h)</Text>
      <View style={styles.bars}>
        {WEEK.map((h, i) => (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { height: Math.max(8, (h / maxH) * 100) }]}
              />
            </View>
            <Text style={styles.barL}>{LABELS[i]}</Text>
            <Text style={styles.barV}>{h}h</Text>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: appTheme.space.sm },
  demoBanner: {
    backgroundColor: appTheme.colors.warningBg,
    borderWidth: 1,
    borderColor: appTheme.colors.warningBorder,
    borderRadius: appTheme.radii.md,
    padding: appTheme.space.md,
    marginBottom: appTheme.space.md,
  },
  demoText: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.warningText,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: appTheme.space.sectionGap,
  },
  tile: {
    width: "48%",
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: appTheme.space.lg,
  },
  tileLabel: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    color: appTheme.colors.textSecondary,
    marginBottom: 6,
  },
  tileValue: {
    fontFamily: appTheme.fonts.light,
    fontSize: appTheme.type.metricMd,
    color: appTheme.colors.text,
  },
  chartTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.section,
    color: appTheme.colors.text,
    marginBottom: appTheme.space.md,
  },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 140,
    marginBottom: appTheme.space.xxl,
  },
  barCol: { flex: 1, alignItems: "center", marginHorizontal: 2 },
  barTrack: {
    width: "100%",
    height: 100,
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.sm,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: appTheme.colors.chartTeal,
    borderTopLeftRadius: appTheme.radii.sm,
    borderTopRightRadius: appTheme.radii.sm,
  },
  barL: { marginTop: 6, fontSize: 10, color: appTheme.colors.textMuted },
  barV: { fontSize: 10, color: appTheme.colors.textSecondary },
});
