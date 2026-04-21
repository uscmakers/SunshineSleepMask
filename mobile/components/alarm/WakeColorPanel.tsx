import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, {
  BrightnessSlider,
  Panel3,
  Preview,
} from "reanimated-color-picker";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { appTheme } from "@/theme/appTheme";

type WakeColorPanelProps = {
  wakeColorHex: string;
  onSelectColorWorklet: (hex: string) => void;
};

export function WakeColorPanel({
  wakeColorHex,
  onSelectColorWorklet,
}: WakeColorPanelProps) {
  const onSelectColor = ({ hex }: { hex: string }) => {
    "worklet";
    scheduleOnRN(onSelectColorWorklet, hex);
  };

  return (
    <View style={styles.block}>
      <SectionHeader
        title="Wake-up light"
        hint="Pick the color the mask uses at the end of the sunrise ramp (MQTT v1 + legacy publish)."
      />
      <ColorPicker
        style={styles.picker}
        value={wakeColorHex}
        onChange={onSelectColor}
      >
        <Panel3 />
        <BrightnessSlider />
        <Preview hideInitialColor />
      </ColorPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: appTheme.space.sm,
  },
  picker: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
});
