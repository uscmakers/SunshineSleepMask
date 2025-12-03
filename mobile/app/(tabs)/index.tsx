import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { initMqtt, sendColor } from "@/hooks/mqttClient";
import React, { useEffect, useRef } from "react";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, {
  BrightnessSlider,
  Panel3,
  Preview,
} from "reanimated-color-picker";

const THROTTLE_INTERVAL_MS = 150; // Send color every 150ms max

export default function TabOneScreen() {
  const lastSentTimeRef = useRef<number>(0);
  const pendingColorRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initMqtt();
    return () => {
      // Cleanup timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const throttledSendColor = (hex: string) => {
    // Store the latest color
    pendingColorRef.current = hex;

    const now = Date.now();
    const timeSinceLastSend = now - lastSentTimeRef.current;

    // If enough time has passed, send immediately
    if (timeSinceLastSend >= THROTTLE_INTERVAL_MS) {
      lastSentTimeRef.current = now;
      if (pendingColorRef.current) {
        sendColor(pendingColorRef.current);
        pendingColorRef.current = null;
      }
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      // Schedule to send after the remaining time (debounce approach)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const remainingTime = THROTTLE_INTERVAL_MS - timeSinceLastSend;
      timeoutRef.current = setTimeout(() => {
        if (pendingColorRef.current) {
          lastSentTimeRef.current = Date.now();
          sendColor(pendingColorRef.current);
          pendingColorRef.current = null;
        }
        timeoutRef.current = null;
      }, remainingTime);
    }
  };

  const onSelectColor = ({ hex }: { hex: string }) => {
    "worklet";
    // Schedule the throttled send on the React Native thread
    scheduleOnRN(throttledSendColor, hex);
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
