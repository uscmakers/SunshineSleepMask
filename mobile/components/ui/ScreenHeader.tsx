import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type ScreenHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle: string;
};

/**
 * Centered hero block used on Alarm / Sounds / Data in Figma Make (64px icon ring).
 */
export function ScreenHeader({ icon, title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <FontAwesome name={icon} size={28} color={appTheme.colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: appTheme.space.lg,
    paddingBottom: appTheme.space.sm,
    marginBottom: appTheme.space.sectionGap,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: appTheme.colors.accentBorderSoft,
    backgroundColor: appTheme.colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: appTheme.space.md,
  },
  title: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.screenTitle,
    lineHeight: appTheme.type.screenTitleLine,
    color: appTheme.colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.subtitle,
    lineHeight: appTheme.type.subtitleLine,
    color: appTheme.colors.textSecondary,
    textAlign: "center",
  },
});
