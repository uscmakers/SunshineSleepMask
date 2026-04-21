import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MaskMqttProvider } from "@/providers/MaskMqttContext";
import { WakePreferencesProvider } from "@/providers/WakePreferencesContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <MaskMqttProvider>
        <WakePreferencesProvider>{children}</WakePreferencesProvider>
      </MaskMqttProvider>
    </SafeAreaProvider>
  );
}
