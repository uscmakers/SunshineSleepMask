import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { appTheme } from "@/theme/appTheme";

type TealLinkProps = {
  label: string;
  onPress?: () => void;
};

export function TealLink({ label, onPress }: TealLinkProps) {
  return (
    <Pressable onPress={onPress} style={styles.hit}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    marginTop: appTheme.space.lg,
    paddingVertical: 4,
  },
  text: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
    fontSize: 15,
  },
});
