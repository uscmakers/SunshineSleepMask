import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type SettingRowProps = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle: string;
};

function SettingRow({ icon, title, subtitle }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWell}>
        <FontAwesome name={icon} size={18} color={appTheme.colors.accent} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

type CurrentSettingsCardProps = {
  nextAlarmLine: string;
  activeSoundLine: string;
  nightModeLine: string;
};

export function CurrentSettingsCard({
  nextAlarmLine,
  activeSoundLine,
  nightModeLine,
}: CurrentSettingsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome
          name="heartbeat"
          size={18}
          color={appTheme.colors.accent}
        />
        <Text style={styles.headerTitle}>Current Settings</Text>
      </View>
      <View style={styles.list}>
        <SettingRow icon="clock-o" title="Next Alarm" subtitle={nextAlarmLine} />
        <SettingRow
          icon="music"
          title="Active Sound"
          subtitle={activeSoundLine}
        />
        <SettingRow
          icon="moon-o"
          title="Night Mode"
          subtitle={nightModeLine}
        />
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
    gap: 32,
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
  list: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: appTheme.colors.surfaceRow,
    borderColor: appTheme.colors.borderInner,
    borderWidth: 1,
    borderRadius: appTheme.radii.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.rowTitle,
    lineHeight: appTheme.type.rowTitleLine,
    color: appTheme.colors.text,
  },
  rowSub: {
    marginTop: 2,
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
});
