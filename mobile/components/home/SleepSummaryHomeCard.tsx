import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type MetricProps = {
  label: string;
  value: string;
  valueAccent?: boolean;
  large?: boolean;
};

function HomeMetric({
  label,
  value,
  valueAccent,
  large,
}: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          large ? styles.metricValueLg : styles.metricValueMd,
          valueAccent && styles.metricValueAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function SleepSummaryHomeCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="calendar" size={22} color={appTheme.colors.accent} />
        <Text style={styles.headerTitle}>Last Night's Sleep</Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <HomeMetric label="Total Duration" value="7h 42m" large />
          <HomeMetric label="Sleep Quality" value="92%" valueAccent large />
        </View>
        <View style={styles.gridRow}>
          <HomeMetric label="Deep Sleep" value="2h 15m" />
          <HomeMetric label="REM Sleep" value="1h 48m" />
        </View>
      </View>
      <View style={styles.insight}>
        <Text style={styles.insightTitle}>💡 Insight</Text>
        <Text style={styles.insightBody}>
          Excellent sleep quality! Your deep sleep was 18% above average.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.border,
    borderWidth: 1,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.cardPadding,
    gap: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
  },
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  metric: {
    flex: 1,
    backgroundColor: appTheme.colors.surfaceRow,
    borderColor: appTheme.colors.borderInner,
    borderWidth: 1,
    borderRadius: appTheme.radii.md,
    paddingHorizontal: appTheme.space.lg,
    paddingVertical: appTheme.space.lg,
    gap: 4,
  },
  metricLabel: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
  metricValueLg: {
    fontFamily: appTheme.fonts.light,
    fontSize: appTheme.type.metricLg,
    lineHeight: appTheme.type.metricLgLine,
    color: appTheme.colors.text,
  },
  metricValueMd: {
    fontFamily: appTheme.fonts.light,
    fontSize: appTheme.type.metricMd,
    lineHeight: appTheme.type.metricMdLine,
    color: appTheme.colors.text,
  },
  metricValueAccent: {
    color: appTheme.colors.accent,
  },
  insight: {
    backgroundColor: appTheme.colors.accentTint,
    borderColor: appTheme.colors.accentBorderSoft,
    borderWidth: 1,
    borderRadius: appTheme.radii.md,
    paddingHorizontal: appTheme.space.lg,
    paddingVertical: appTheme.space.lg,
    gap: 4,
  },
  insightTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.accent,
  },
  insightBody: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textInsightBody,
  },
});
