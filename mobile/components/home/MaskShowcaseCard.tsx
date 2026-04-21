import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

/** Same Unsplash hero as Figma Make `HomePage.tsx` (sleep mask product photography). */
const HERO_IMAGE_URI =
  "https://images.unsplash.com/photo-1614267118647-20134cb33c35?w=1200&h=800&fit=crop&q=80";

/**
 * Figma Make: photo hero over neutral gradient; model strip below.
 * 3D “drag to rotate” is not in Expo build — caption kept as product label only.
 */
export function MaskShowcaseCard() {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["#262626", "#171717"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.hero}
      >
        <Image
          source={{ uri: HERO_IMAGE_URI }}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Sunshine Sleep Mask product preview"
        />
        <Text style={styles.hint}>Sunshine Sleep Mask</Text>
      </LinearGradient>
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
    alignItems: "stretch",
    overflow: "hidden",
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
