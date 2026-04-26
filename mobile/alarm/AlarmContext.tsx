import React, { createContext, useContext, useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type AlarmDay = (typeof DAYS)[number];

export type AlarmItem = {
  id: string;
  rawTime: Date;
  time: string;
  label: string;
  days: AlarmDay[];
  enabled: boolean;
};

type AlarmContextValue = {
  alarms: AlarmItem[];
  toggleAlarm: (id: string) => void;
  deleteAlarm: (id: string) => void;
  upsertAlarm: (next: AlarmItem) => void;
  getNextEnabledAlarm: () => AlarmItem | null;
};

const AlarmCtx = createContext<AlarmContextValue | null>(null);

export function formatTime(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDaysLabel(days: AlarmDay[]) {
  if (days.length === 0) return "No repeat";
  if (days.length === 7) return "Every day";
  const weekdays: AlarmDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekends: AlarmDay[] = ["Sat", "Sun"];
  if (weekdays.every((d) => days.includes(d)) && !days.includes("Sat") && !days.includes("Sun")) {
    return "Weekdays";
  }
  if (weekends.every((d) => days.includes(d)) && days.length === 2) {
    return "Weekends";
  }
  return days.join(", ");
}

const initialAlarms: AlarmItem[] = [
  {
    id: "1",
    rawTime: new Date(2026, 0, 1, 7, 0),
    time: formatTime(new Date(2026, 0, 1, 7, 0)),
    label: "Weekdays",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    enabled: true,
  },
  {
    id: "2",
    rawTime: new Date(2026, 0, 1, 9, 0),
    time: formatTime(new Date(2026, 0, 1, 9, 0)),
    label: "Weekends",
    days: ["Sat", "Sun"],
    enabled: false,
  },
];

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<AlarmItem[]>(initialAlarms);

  const value = useMemo<AlarmContextValue>(
    () => ({
      alarms,
      toggleAlarm: (id: string) => {
        setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
      },
      deleteAlarm: (id: string) => {
        setAlarms((prev) => prev.filter((a) => a.id !== id));
      },
      upsertAlarm: (next: AlarmItem) => {
        setAlarms((prev) => {
          const idx = prev.findIndex((a) => a.id === next.id);
          if (idx < 0) return [...prev, next];
          const clone = [...prev];
          clone[idx] = next;
          return clone;
        });
      },
      getNextEnabledAlarm: () => {
        const enabled = alarms.filter((a) => a.enabled);
        if (!enabled.length) return null;
        const sorted = [...enabled].sort(
          (a, b) =>
            a.rawTime.getHours() * 60 +
            a.rawTime.getMinutes() -
            (b.rawTime.getHours() * 60 + b.rawTime.getMinutes())
        );
        return sorted[0] ?? null;
      },
    }),
    [alarms]
  );

  return <AlarmCtx.Provider value={value}>{children}</AlarmCtx.Provider>;
}

export function useAlarmContext() {
  const ctx = useContext(AlarmCtx);
  if (!ctx) {
    throw new Error("useAlarmContext must be used within AlarmProvider");
  }
  return ctx;
}
