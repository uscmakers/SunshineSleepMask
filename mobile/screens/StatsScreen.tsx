import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MetricTile } from "@/components/stats/MetricTile";
import { AppScreen } from "@/components/ui/AppScreen";
import { PanelCard } from "@/components/ui/PanelCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { appTheme } from "@/theme/appTheme";

export default function StatsScreen() {
  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <Text style={styles.title}>Sleep data</Text>
      <SectionHeader
        title="Last night (preview)"
        hint="HealthKit-backed sleep duration and stages require an Expo development build with native entitlements, not Expo Go."
      />

      <View style={styles.tiles}>
        <MetricTile label="Time asleep" value="—" hint="Sample UI" />
        <MetricTile label="Bedtime" value="—" />
        <MetricTile label="Wake time" value="—" />
        <MetricTile label="Consistency" value="—" hint="Rolling 7 nights" />
      </View>

      <PanelCard>
        <Text style={styles.cardTitle}>Next implementation steps</Text>
        <Text style={styles.cardLine}>• Run `npx expo prebuild` when ready</Text>
        <Text style={styles.cardLine}>
          • Add HealthKit capability + usage strings
        </Text>
        <Text style={styles.cardLine}>
          • Use a small native module or maintained HealthKit bridge
        </Text>
        <Text style={styles.cardLine}>
          • Query last night’s sleep samples and render charts
        </Text>
      </PanelCard>
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
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
    marginBottom: 10,
  },
  cardLine: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    marginBottom: 6,
  },
});
