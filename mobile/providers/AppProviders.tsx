import React from "react";

import { MaskMqttProvider } from "@/providers/MaskMqttContext";
import { WakePreferencesProvider } from "@/providers/WakePreferencesContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MaskMqttProvider>
      <WakePreferencesProvider>{children}</WakePreferencesProvider>
    </MaskMqttProvider>
  );
}
