import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

type OptionChipRowProps<T extends string | number> = {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
};

export function OptionChipRow<T extends string | number>({
  options,
  selected,
  onSelect,
  formatLabel = (v) => String(v),
}: OptionChipRowProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt === selected;
        return (
          <TouchableOpacity
            key={String(opt)}
            style={[styles.chip, active && styles.chipSelected]}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextSelected]}>
              {formatLabel(opt)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: appTheme.space.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: appTheme.radii.pill,
    backgroundColor: appTheme.colors.surfaceRow,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  chipSelected: {
    backgroundColor: appTheme.colors.accentSurface,
    borderColor: appTheme.colors.accent,
  },
  chipText: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: 14,
  },
  chipTextSelected: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
  },
});
