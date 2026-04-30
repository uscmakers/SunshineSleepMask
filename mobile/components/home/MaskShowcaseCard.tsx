import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

export function MaskShowcaseCard() {
  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/mask-product.png")}
          style={styles.heroImage}
          resizeMode="contain"
          accessibilityLabel="Sunshine Sleep Mask product photo"
        />
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
  heroImage: {
    width: "100%",
    height: "100%",
  },
  modelStrip: {
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.space.lg,
    paddingVertical: appTheme.space.lg,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    alignItems: "center",
  },
  modelLabel: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
    textAlign: "center",
  },
  modelName: {
    marginTop: 4,
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    color: appTheme.colors.text,
    textAlign: "center",
  },
});
