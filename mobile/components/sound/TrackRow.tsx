import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { appTheme } from "@/theme/appTheme";

export type LibraryTrack = {
  id: string;
  title: string;
  subtitle: string;
};

type TrackRowProps = {
  track: LibraryTrack;
  active: boolean;
  onPress: () => void;
};

export function TrackRow({ track, active, onPress }: TrackRowProps) {
  return (
    <Pressable
      style={[styles.row, active && styles.rowActive]}
      onPress={onPress}
    >
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.sub}>{track.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    marginBottom: 10,
  },
  rowActive: {
    borderColor: appTheme.colors.accent,
  },
  title: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.text,
    fontSize: appTheme.type.rowTitle,
    lineHeight: appTheme.type.rowTitleLine,
  },
  sub: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.label,
    lineHeight: appTheme.type.labelLine,
    marginTop: 4,
  },
});
