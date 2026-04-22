import React from "react";
import { StyleSheet, View } from "react-native";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, {
  BrightnessSlider,
  Panel3,
  Preview,
} from "reanimated-color-picker";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { appTheme } from "@/theme/appTheme";

type Props = {
  /** Receives picked hex on the JS thread (after scheduleOnRN). */
  onColorPicked: (hex: string) => void;
};

export function WakeLightCard({ onColorPicked }: Props) {
  const onSelect = ({ hex }: { hex: string }) => {
    "worklet";
    scheduleOnRN(onColorPicked, hex);
  };

  return (
    <View style={styles.card}>
      <SectionHeader
        title="Wake light"
        hint="Adjust color sent to the mask (MQTT). Drag to change."
      />
      <ColorPicker
        style={styles.picker}
        value="white"
        onChange={onSelect}
      >
        <Panel3 />
        <BrightnessSlider />
        <Preview hideInitialColor />
      </ColorPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.cardPadding,
    marginTop: appTheme.space.sectionGap,
  },
  picker: {
    width: "100%",
    gap: 10,
  },
});
