import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

const HERO_IMAGE_URI =
  "https://images.unsplash.com/photo-1614267118647-20134cb33c35?w=1200&h=800&fit=crop&q=80";

export function MaskShowcaseCard() {
  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <Image
          source={{ uri: HERO_IMAGE_URI }}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Sunshine Sleep Mask"
        />
        <Text style={styles.hint}>Sunshine Sleep Mask</Text>
      </View>
      <View style={styles.modelStrip}>
        <Text style={styles.modelLabel}>Model</Text>
        <Text style={styles.modelName}>Sunshine Sleep Mask Pro</Text>
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
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  heroImage: {
    width: "100%",
    height: 224,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surfaceRow,
  },
  hint: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textMuted,
    textAlign: "center",
    marginTop: 10,
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
