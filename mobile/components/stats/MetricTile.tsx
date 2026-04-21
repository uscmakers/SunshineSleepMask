import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type MetricTileProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricTile({ label, value, hint }: MetricTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: "42%",
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: appTheme.space.lg,
    marginBottom: appTheme.space.sm,
  },
  label: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    marginBottom: 6,
  },
  value: {
    fontFamily: appTheme.fonts.light,
    color: appTheme.colors.text,
    fontSize: appTheme.type.metricMd,
    lineHeight: appTheme.type.metricMdLine,
  },
  hint: {
    fontFamily: appTheme.fonts.regular,
    marginTop: 6,
    color: appTheme.colors.textDim,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
  },
});
