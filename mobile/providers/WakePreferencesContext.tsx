import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * App-wide **defaults only** (new alarms, copy hints). Per-alarm sunrise, snooze,
 * and LED color live on each alarm in `AlarmScheduleContext`.
 */
type WakePreferences = {
  defaultWakeColorHex: string;
  setDefaultWakeColorHex: (hex: string) => void;
  defaultSunriseRampMinutes: number;
  setDefaultSunriseRampMinutes: (m: number) => void;
  defaultSnoozeMinutes: number;
  setDefaultSnoozeMinutes: (m: number) => void;
};

const WakePreferencesContext = createContext<WakePreferences | null>(null);

export function WakePreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [defaultWakeColorHex, setDefaultWakeColorHex] = useState("#FFC46B");
  const [defaultSunriseRampMinutes, setDefaultSunriseRampMinutes] =
    useState(10);
  const [defaultSnoozeMinutes, setDefaultSnoozeMinutes] = useState(9);

  const value = useMemo(
    () => ({
      defaultWakeColorHex,
      setDefaultWakeColorHex,
      defaultSunriseRampMinutes,
      setDefaultSunriseRampMinutes,
      defaultSnoozeMinutes,
      setDefaultSnoozeMinutes,
    }),
    [
      defaultWakeColorHex,
      defaultSunriseRampMinutes,
      defaultSnoozeMinutes,
    ]
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
