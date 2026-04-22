import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type SectionHeaderProps = {
  title: string;
  hint?: string;
};

export function SectionHeader({ title, hint }: SectionHeaderProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: appTheme.space.md,
  },
  title: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.section,
    lineHeight: appTheme.type.sectionLine,
    color: appTheme.colors.text,
  },
  hint: {
    marginTop: 4,
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textMuted,
  },
});
