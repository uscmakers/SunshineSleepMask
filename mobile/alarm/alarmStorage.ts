import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AlarmDay, AlarmItem } from "@/alarm/types";

const STORAGE_KEY = "@sunshine_sleep_mask/alarms_v1";

export type AlarmLedPersisted = {
  mode: "sunrise" | "custom";
  sunriseBrightness: number;
  sunriseDuration: number;
  snoozeDuration: number;
  customBrightness: number;
  customColor: string;
};

export type AlarmsPersistedSnapshot = {
  alarms: Array<{
    id: string;
    rawTime: string;
    time: string;
    label: string;
    days: AlarmDay[];
    enabled: boolean;
  }>;
  ledSettings: Record<string, AlarmLedPersisted>;
  lastAutoFired?: Record<string, number>;
};

export function serializeAlarms(alarms: AlarmItem[]): AlarmsPersistedSnapshot["alarms"] {
  return alarms.map((a) => ({
    id: a.id,
    rawTime: a.rawTime.toISOString(),
    time: a.time,
    label: a.label,
    days: a.days,
    enabled: a.enabled,
  }));
}

export function deserializeAlarms(rows: AlarmsPersistedSnapshot["alarms"]): AlarmItem[] {
  return rows.map((r) => ({
    id: r.id,
    rawTime: new Date(r.rawTime),
    time: r.time,
    label: r.label,
    days: r.days,
    enabled: r.enabled,
  }));
}

export async function loadAlarmsSnapshot(): Promise<AlarmsPersistedSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AlarmsPersistedSnapshot;
    if (!parsed || !Array.isArray(parsed.alarms)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAlarmsSnapshot(snapshot: AlarmsPersistedSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}
