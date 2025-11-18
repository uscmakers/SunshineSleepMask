import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { initMqtt, sendColor } from "@/hooks/mqttClient";
import React, { useEffect } from "react";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, {
  BrightnessSlider,
  Panel3,
  Preview,
} from "reanimated-color-picker";

export default function TabOneScreen() {
  useEffect(() => {
    initMqtt();
  }, []);

  const onSelectColor = ({ hex }: { hex: string }) => {
    "worklet";
    // do something with the selected color.
    console.log(hex);
    scheduleOnRN(sendColor, hex);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color Picker</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <ColorPicker
        style={{ width: "70%", gap: 10 }}
        value="white"
        onComplete={onSelectColor}
      >
        <Panel3 />
        <BrightnessSlider />
        <Preview hideInitialColor />
      </ColorPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
