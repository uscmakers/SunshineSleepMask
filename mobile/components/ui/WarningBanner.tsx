import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

export function WarningBanner({ message }: { message: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: appTheme.colors.warningBg,
    borderColor: appTheme.colors.warningBorder,
    borderWidth: 1,
    borderRadius: appTheme.radii.md,
    padding: 12,
    marginBottom: appTheme.space.md,
  },
  text: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.warningText,
    fontSize: appTheme.type.label,
    lineHeight: appTheme.type.labelLine,
  },
});
