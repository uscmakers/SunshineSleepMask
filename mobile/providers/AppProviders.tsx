import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AlarmScheduleProvider } from "@/providers/AlarmScheduleContext";
import { MaskMqttProvider } from "@/providers/MaskMqttContext";
import { WakePreferencesProvider } from "@/providers/WakePreferencesContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <MaskMqttProvider>
        <WakePreferencesProvider>
          <AlarmScheduleProvider>{children}</AlarmScheduleProvider>
        </WakePreferencesProvider>
      </MaskMqttProvider>
    </SafeAreaProvider>
  );
}
