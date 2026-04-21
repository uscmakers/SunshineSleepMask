import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

export type AmbientTrack = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
};

type AmbientTrackRowProps = {
  track: AmbientTrack;
  playing: boolean;
  onPressRow: () => void;
  onPressPlay: () => void;
};

export function AmbientTrackRow({
  track,
  playing,
  onPressRow,
  onPressPlay,
}: AmbientTrackRowProps) {
  return (
    <View style={[styles.row, playing && styles.rowActive]}>
      <Pressable
        onPress={onPressRow}
        style={({ pressed }) => [
          styles.rowMain,
          pressed && styles.rowPressed,
        ]}
      >
        <Text style={styles.emoji}>{track.emoji}</Text>
        <View style={styles.texts}>
          <Text style={styles.title}>{track.title}</Text>
          <Text style={styles.sub}>{track.subtitle}</Text>
        </View>
      </Pressable>
      <TouchableOpacity onPress={onPressPlay} hitSlop={12} style={styles.playBtn}>
        <FontAwesome
          name={playing ? "pause" : "play"}
          size={16}
          color={appTheme.colors.accent}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 8,
    minWidth: 0,
  },
  rowActive: {
    borderColor: appTheme.colors.accent,
  },
  rowPressed: {
    opacity: 0.92,
  },
  emoji: {
    fontSize: 22,
  },
  texts: {
    flex: 1,
    minWidth: 0,
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
    marginTop: 2,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceRow,
    marginRight: 12,
  },
});
