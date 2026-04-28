import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { getAutoTriggerFireAtIfDue, getGloballyNextAlarm, type NextAlarmInfo } from "@/alarm/alarmSchedule";
import {
  deserializeAlarms,
  loadAlarmsSnapshot,
  saveAlarmsSnapshot,
  serializeAlarms,
  type AlarmLedPersisted,
} from "@/alarm/alarmStorage";
import type { AlarmDay, AlarmItem, AlarmLedSettings } from "@/alarm/types";
import { initMqtt, sendAlarmSettings, sendColor } from "@/hooks/mqttClient";

export type { AlarmDay, AlarmItem, AlarmLedSettings } from "@/alarm/types";
export type { NextAlarmInfo };

const CHECK_INTERVAL_MS = 45_000;
const TRIGGER_GRACE_MS = 180_000;

type AlarmContextValue = {
  alarms: AlarmItem[];
  ledSettingsById: Record<string, AlarmLedSettings>;
  storageReady: boolean;
  toggleAlarm: (id: string) => void;
  deleteAlarm: (id: string) => void;
  upsertAlarm: (next: AlarmItem) => void;
  updateLedSettings: (id: string, partial: Partial<AlarmLedSettings>) => void;
  /** @deprecated prefer getNextScheduledAlarm — kept for quick compatibility */
  getNextEnabledAlarm: () => AlarmItem | null;
  getNextScheduledAlarm: () => NextAlarmInfo | null;
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

export function createDefaultLedSettings(): AlarmLedSettings {
  return {
    mode: "sunrise",
    sunriseBrightness: 0.8,
    sunriseDuration: 20,
    snoozeDuration: 10,
    customBrightness: 0.8,
    customColor: "#FFAA66",
    mqttMsg: null,
  };
}

function ledToPersisted(led: AlarmLedSettings): AlarmLedPersisted {
  return {
    mode: led.mode,
    sunriseBrightness: led.sunriseBrightness,
    sunriseDuration: led.sunriseDuration,
    snoozeDuration: led.snoozeDuration,
    customBrightness: led.customBrightness,
    customColor: led.customColor,
  };
}

function ledFromPersisted(p: AlarmLedPersisted): AlarmLedSettings {
  return { ...p, mqttMsg: null };
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
  const [ledSettingsById, setLedSettingsById] = useState<Record<string, AlarmLedSettings>>({});
  const [lastAutoFired, setLastAutoFired] = useState<Record<string, number>>({});
  const [storageReady, setStorageReady] = useState(false);

  const alarmsRef = useRef(alarms);
  alarmsRef.current = alarms;
  const ledRef = useRef(ledSettingsById);
  ledRef.current = ledSettingsById;
  const lastFiredRef = useRef(lastAutoFired);

  useEffect(() => {
    lastFiredRef.current = lastAutoFired;
  }, [lastAutoFired]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await loadAlarmsSnapshot();
      if (cancelled) return;
      if (snap) {
        const loadedAlarms = deserializeAlarms(snap.alarms);
        const ids = new Set(loadedAlarms.map((a) => a.id));
        setAlarms(loadedAlarms);
        const led: Record<string, AlarmLedSettings> = {};
        for (const [id, v] of Object.entries(snap.ledSettings ?? {})) {
          if (ids.has(id)) led[id] = ledFromPersisted(v);
        }
        setLedSettingsById(led);
        const fired = snap.lastAutoFired ?? {};
        const prunedFired: Record<string, number> = {};
        for (const [id, t] of Object.entries(fired)) {
          if (ids.has(id)) prunedFired[id] = t;
        }
        setLastAutoFired(prunedFired);
      }
      setStorageReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    setLedSettingsById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const a of alarms) {
        if (!next[a.id]) {
          next[a.id] = createDefaultLedSettings();
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [storageReady, alarms]);

  useEffect(() => {
    if (!storageReady) return;
    const payload = {
      alarms: serializeAlarms(alarms),
      ledSettings: Object.fromEntries(
        Object.entries(ledSettingsById).map(([id, l]) => [id, ledToPersisted(l)])
      ) as Record<string, AlarmLedPersisted>,
      lastAutoFired,
    };
    void saveAlarmsSnapshot(payload);
  }, [storageReady, alarms, ledSettingsById, lastAutoFired]);

  const runAutoTriggerTick = useCallback(() => {
    const now = new Date();
    const nextFired: Record<string, number> = {};
    for (const alarm of alarmsRef.current) {
      if (!alarm.enabled) continue;
      const fireAt = getAutoTriggerFireAtIfDue(alarm, now, TRIGGER_GRACE_MS);
      if (!fireAt) continue;
      const t = fireAt.getTime();
      if (lastFiredRef.current[alarm.id] === t) continue;
      const led = ledRef.current[alarm.id] ?? createDefaultLedSettings();
      initMqtt();
      if (led.mode === "sunrise") {
        sendAlarmSettings(led.sunriseDuration, led.sunriseBrightness);
      } else {
        sendColor(led.customColor);
      }
      nextFired[alarm.id] = t;
    }
    if (Object.keys(nextFired).length) {
      setLastAutoFired((p) => {
        const merged = { ...p, ...nextFired };
        lastFiredRef.current = merged;
        return merged;
      });
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const id = setInterval(runAutoTriggerTick, CHECK_INTERVAL_MS);
    runAutoTriggerTick();
    return () => clearInterval(id);
  }, [storageReady, runAutoTriggerTick]);

  useEffect(() => {
    if (!storageReady) return;
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") runAutoTriggerTick();
    });
    return () => sub.remove();
  }, [storageReady, runAutoTriggerTick]);

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    setLedSettingsById((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setLastAutoFired((prev) => {
      const { [id]: __, ...rest } = prev;
      return rest;
    });
  }, []);

  const upsertAlarm = useCallback((next: AlarmItem) => {
    setAlarms((prev) => {
      const idx = prev.findIndex((a) => a.id === next.id);
      if (idx < 0) return [...prev, next];
      const clone = [...prev];
      clone[idx] = next;
      return clone;
    });
    setLedSettingsById((prev) => {
      if (prev[next.id]) return prev;
      return { ...prev, [next.id]: createDefaultLedSettings() };
    });
  }, []);

  const updateLedSettings = useCallback((id: string, partial: Partial<AlarmLedSettings>) => {
    setLedSettingsById((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? createDefaultLedSettings()), ...partial },
    }));
  }, []);

  const getNextScheduledAlarm = useCallback((): NextAlarmInfo | null => {
    return getGloballyNextAlarm(alarms, new Date());
  }, [alarms]);

  const getNextEnabledAlarm = useCallback((): AlarmItem | null => {
    return getNextScheduledAlarm()?.alarm ?? null;
  }, [getNextScheduledAlarm]);

  const value = useMemo<AlarmContextValue>(
    () => ({
      alarms,
      ledSettingsById,
      storageReady,
      toggleAlarm,
      deleteAlarm,
      upsertAlarm,
      updateLedSettings,
      getNextEnabledAlarm,
      getNextScheduledAlarm,
    }),
    [
      alarms,
      ledSettingsById,
      storageReady,
      toggleAlarm,
      deleteAlarm,
      upsertAlarm,
      updateLedSettings,
      getNextEnabledAlarm,
      getNextScheduledAlarm,
    ]
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
