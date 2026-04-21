import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

export type SoundSourceTab = "ambient" | "spotify";

type SoundSourceTabsProps = {
  active: SoundSourceTab;
  onChange: (tab: SoundSourceTab) => void;
};

export function SoundSourceTabs({ active, onChange }: SoundSourceTabsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange("ambient")}
        style={[styles.tab, active === "ambient" && styles.tabOn]}
      >
        <Text style={[styles.tabText, active === "ambient" && styles.tabTextOn]}>
          Ambient Sounds
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("spotify")}
        style={[styles.tab, active === "spotify" && styles.tabOn]}
      >
        <Text style={[styles.tabText, active === "spotify" && styles.tabTextOn]}>
          Spotify
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: 4,
    marginBottom: appTheme.space.lg,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: appTheme.radii.sm,
    alignItems: "center",
  },
  tabOn: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  tabText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.label,
    lineHeight: appTheme.type.labelLine,
    color: appTheme.colors.textMuted,
  },
  tabTextOn: {
    color: appTheme.colors.text,
  },
});
