import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type Props = {
  statusTitle: string;
  statusSubtitle: string;
};

export function DeviceConnectionCard({ statusTitle, statusSubtitle }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.statusTitle}>{statusTitle}</Text>
      <Text style={styles.statusSub}>{statusSubtitle}</Text>
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
    alignItems: "center",
  },
  statusTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
    textAlign: "center",
    alignSelf: "stretch",
  },
  statusSub: {
    marginTop: 2,
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
    textAlign: "center",
    alignSelf: "stretch",
  },
});
