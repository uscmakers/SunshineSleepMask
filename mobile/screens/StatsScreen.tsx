import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MetricTile } from "@/components/stats/MetricTile";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

/** Static week sample (hours) — placeholder until HealthKit / device export. */
const WEEKLY_HOURS = [7.5, 8, 6.5, 7, 8.2, 9, 7.8];
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const QUALITY_POINTS = [88, 90, 85, 87, 92, 94, 91];
const STAGES = [
  { key: "awake", label: "Awake", pct: 8, color: "#737373" },
  { key: "rem", label: "REM", pct: 22, color: appTheme.colors.chartTealLight },
  { key: "light", label: "Light", pct: 52, color: appTheme.colors.chartTeal },
  { key: "deep", label: "Deep", pct: 18, color: appTheme.colors.chartTealDeep },
];

export default function StatsScreen() {
  const maxH = Math.max(...WEEKLY_HOURS, 0.1);
  const maxQ = 100;

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>
          Demo data — charts and metrics are placeholders until HealthKit or mask
          export is integrated.
        </Text>
      </View>
      <ScreenHeader
        icon="bar-chart"
        title="Sleep Data"
        subtitle="Track your sleep patterns and quality"
      />

      <View style={styles.summaryGrid}>
        <MetricTile label="Avg Sleep" value="7h 45m" />
        <MetricTile label="Sleep Quality" value="89%" />
        <MetricTile label="Deep Sleep" value="1h 52m" />
        <MetricTile label="REM Sleep" value="1h 48m" />
        <MetricTile label="Sleep Latency" value="12 min" />
        <MetricTile label="Wake-ups" value="2" />
        <MetricTile label="Consistency" value="85%" />
        <MetricTile label="Efficiency" value="94%" />
      </View>

      <Text style={styles.chartTitle}>Weekly Sleep Duration</Text>
      <View style={styles.barChart}>
        {WEEKLY_HOURS.map((h, i) => (
          <View key={WEEK_LABELS[i]} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: Math.max(6, (h / maxH) * 120) },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{WEEK_LABELS[i]}</Text>
            <Text style={styles.barVal}>{h}h</Text>
          </View>
        ))}
      </View>

      <Text style={styles.chartTitle}>Sleep Quality Trend</Text>
      <View style={styles.lineChart}>
        <View style={styles.lineColumns}>
          {QUALITY_POINTS.map((q, i) => (
            <View key={i} style={styles.lineCol}>
              <View style={styles.lineColTrack}>
                <View
                  style={[
                    styles.lineColFill,
                    { height: Math.max(8, (q / maxQ) * 88) },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{WEEK_LABELS[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.chartTitle}>{"Last Night's Sleep Stages"}</Text>
      <View style={styles.stageBar}>
        {STAGES.map((s) => (
          <View
            key={s.key}
            style={[styles.stageSeg, { flex: s.pct, backgroundColor: s.color }]}
          />
        ))}
      </View>
      <View style={styles.stageLegend}>
        {STAGES.map((s) => (
          <View key={s.key} style={styles.legendRow}>
            <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>
              {s.label} {s.pct}%
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Insights</Text>
        <Text style={styles.insightLine}>
          • Your sleep quality improved 5% this week vs last week.
        </Text>
        <Text style={styles.insightLine}>
          • Deep sleep is strongest Tuesday–Thursday (sample UI).
        </Text>
        <Text style={styles.insightLine}>
          • HealthKit-backed charts need a dev build; this layout mirrors Figma
          Make without web-only `recharts`.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: appTheme.space.sm,
  },
  demoBanner: {
    backgroundColor: appTheme.colors.warningBg,
    borderWidth: 1,
    borderColor: appTheme.colors.warningBorder,
    borderRadius: appTheme.radii.md,
    padding: appTheme.space.md,
    marginBottom: appTheme.space.md,
  },
  demoBannerText: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.warningText,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: appTheme.space.sectionGap,
  },
  chartTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.section,
    lineHeight: appTheme.type.sectionLine,
    color: appTheme.colors.text,
    marginBottom: appTheme.space.md,
    marginTop: appTheme.space.sm,
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    marginBottom: appTheme.space.sectionGap,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  barTrack: {
    width: "100%",
    height: 120,
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  barFill: {
    width: "100%",
    backgroundColor: appTheme.colors.chartTeal,
    borderTopLeftRadius: appTheme.radii.sm,
    borderTopRightRadius: appTheme.radii.sm,
    minHeight: 4,
  },
  barLabel: {
    marginTop: 6,
    fontFamily: appTheme.fonts.regular,
    fontSize: 10,
    color: appTheme.colors.textMuted,
  },
  barVal: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 10,
    color: appTheme.colors.textSecondary,
  },
  lineChart: {
    marginBottom: appTheme.space.sectionGap,
  },
  lineColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    paddingVertical: appTheme.space.md,
    paddingHorizontal: 4,
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  lineCol: {
    flex: 1,
    alignItems: "center",
  },
  lineColTrack: {
    width: "100%",
    height: 96,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  lineColFill: {
    width: 10,
    borderRadius: 5,
    backgroundColor: appTheme.colors.chartTeal,
  },
  stageBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: appTheme.space.md,
  },
  stageSeg: {
    height: "100%",
  },
  stageLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: appTheme.space.sectionGap,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    color: appTheme.colors.textSecondary,
  },
  insightCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.space.cardPadding,
    marginBottom: appTheme.space.xxl,
    gap: 8,
  },
  insightTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  insightLine: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
});
