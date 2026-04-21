import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

/**
 * Simplified stand-in for Figma `SleepMask3D` (vector illustration + drag affordance).
 * Full 3D parity would need the exported asset or a runtime renderer.
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
        <View style={styles.eyesRow}>
          <LinearGradient
            colors={["#ff6467", appTheme.colors.accentEyeInner]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eye}
          />
          <LinearGradient
            colors={["#ff6467", appTheme.colors.accentEyeInner]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eye}
          />
        </View>
        <Text style={styles.hint}>Drag to rotate • Sunshine Sleep Mask</Text>
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
    minHeight: 216,
    paddingTop: 28,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  eyesRow: {
    flexDirection: "row",
    gap: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  eye: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  hint: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textMuted,
    textAlign: "center",
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
