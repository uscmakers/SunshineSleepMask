import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type SectionHeaderProps = {
  title: string;
  hint?: string;
};

export function SectionHeader({ title, hint }: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: appTheme.space.xl,
    marginBottom: appTheme.space.sm,
  },
  title: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.section,
    lineHeight: appTheme.type.sectionLine,
    color: appTheme.colors.text,
  },
  hint: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.label,
    lineHeight: appTheme.type.labelLine,
    color: appTheme.colors.textMuted,
    marginTop: appTheme.space.xs,
  },
});
