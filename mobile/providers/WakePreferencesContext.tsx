import React, { createContext, useContext, useMemo, useState } from "react";

type WakePreferences = {
  wakeColorHex: string;
  setWakeColorHex: (hex: string) => void;
  sunriseRampMinutes: number;
  setSunriseRampMinutes: (m: number) => void;
  snoozeMinutes: number;
  setSnoozeMinutes: (m: number) => void;
};

const WakePreferencesContext = createContext<WakePreferences | null>(null);

export function WakePreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wakeColorHex, setWakeColorHex] = useState("#FFC46B");
  const [sunriseRampMinutes, setSunriseRampMinutes] = useState(10);
  const [snoozeMinutes, setSnoozeMinutes] = useState(9);

  const value = useMemo(
    () => ({
      wakeColorHex,
      setWakeColorHex,
      sunriseRampMinutes,
      setSunriseRampMinutes,
      snoozeMinutes,
      setSnoozeMinutes,
    }),
    [wakeColorHex, sunriseRampMinutes, snoozeMinutes]
  );

  return (
    <WakePreferencesContext.Provider value={value}>
      {children}
    </WakePreferencesContext.Provider>
  );
}

export function useWakePreferences() {
  const ctx = useContext(WakePreferencesContext);
  if (!ctx) {
    throw new Error("useWakePreferences must be used within WakePreferencesProvider");
  }
  return ctx;
}
