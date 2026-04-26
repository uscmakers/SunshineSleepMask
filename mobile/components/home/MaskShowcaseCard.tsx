import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

export function MaskShowcaseCard() {
  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <FontAwesome name="image" size={64} color="#0A0A0A" />
      </View>
      <View style={styles.modelStrip}>
        <Text style={styles.modelLabel}>Model</Text>
        <Text style={styles.modelName}>Sunshine Sleep Mask</Text>
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
    overflow: "hidden",
  },
  hero: {
    height: 244,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  modelStrip: {
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.space.lg,
    paddingVertical: appTheme.space.lg,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
  modelLabel: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
  modelName: {
    marginTop: 4,
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
  },
});
