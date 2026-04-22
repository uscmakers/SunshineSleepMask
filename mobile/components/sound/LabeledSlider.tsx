import Slider from "@react-native-community/slider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue: (v: number) => string;
  onValueChange: (v: number) => void;
};

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  formatValue,
  onValueChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.val}>{formatValue(value)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={appTheme.colors.accent}
        maximumTrackTintColor={appTheme.colors.borderInner}
        thumbTintColor={appTheme.colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: appTheme.space.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.label,
  },
  val: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.text,
    fontSize: appTheme.type.body,
  },
  slider: { width: "100%", height: 40 },
});
