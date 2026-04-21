import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type DeviceConnectionCardProps = {
  statusTitle: string;
  statusSubtitle: string;
  batteryPercent: number | null;
  /** When false, icon uses muted styling (Figma Make disconnected state). */
  connected: boolean;
  /** Shown when broker is up but mask has no recent heartbeat (Make “Connect Device”). */
  showConnectCta?: boolean;
  onConnectPress?: () => void;
  /** Label for the connect row (set expectations: broker vs mask). */
  connectCtaLabel?: string;
};

export function DeviceConnectionCard({
  statusTitle,
  statusSubtitle,
  batteryPercent,
  connected,
  showConnectCta,
  onConnectPress,
  connectCtaLabel = "Retry broker connection",
}: DeviceConnectionCardProps) {
  const pct =
    batteryPercent != null && Number.isFinite(batteryPercent)
      ? `${Math.round(batteryPercent)}%`
      : "—";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View
            style={[styles.iconWell, !connected && styles.iconWellMuted]}
          >
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
          <Text style={styles.batteryText}>{pct}</Text>
        </View>
      </View>
      {showConnectCta && onConnectPress ? (
        <Pressable
          onPress={onConnectPress}
          style={({ pressed }) => [
            styles.connectRow,
            pressed && styles.connectRowPressed,
          ]}
        >
          <FontAwesome name="link" size={16} color={appTheme.colors.accent} />
          <Text style={styles.connectText}>{connectCtaLabel}</Text>
          <FontAwesome
            name="chevron-right"
            size={12}
            color={appTheme.colors.textMuted}
          />
        </Pressable>
      ) : null}
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
  connectRow: {
    marginTop: appTheme.space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: appTheme.space.md,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    backgroundColor: appTheme.colors.surfaceRow,
  },
  connectRowPressed: {
    opacity: 0.85,
  },
  connectText: {
    flex: 1,
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.text,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
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
