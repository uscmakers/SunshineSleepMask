import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type Props = {
  statusTitle: string;
  statusSubtitle: string;
  batteryPercent: string;
  connected: boolean;
};

export function DeviceConnectionCard({
  statusTitle,
  statusSubtitle,
  batteryPercent,
  connected,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.iconWell, !connected && styles.iconWellMuted]}>
            <FontAwesome
              name="bluetooth-b"
              size={22}
              color={connected ? appTheme.colors.accent : appTheme.colors.textMuted}
            />
          </View>
          <View style={styles.titles}>
            <Text style={styles.statusTitle}>{statusTitle}</Text>
            <Text style={styles.statusSub}>{statusSubtitle}</Text>
          </View>
        </View>
        <View style={styles.batteryPill}>
          <FontAwesome
            name="battery-three-quarters"
            size={18}
            color={appTheme.colors.accent}
          />
          <Text style={styles.batteryText}>{batteryPercent}</Text>
        </View>
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: appTheme.radii.full,
    backgroundColor: appTheme.colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWellMuted: {
    backgroundColor: appTheme.colors.surfaceRow,
  },
  titles: { flex: 1, minWidth: 0 },
  statusTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
  },
  statusSub: {
    marginTop: 2,
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
  batteryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: appTheme.colors.surfaceRow,
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 10,
    borderRadius: appTheme.radii.full,
  },
  batteryText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
  },
});
