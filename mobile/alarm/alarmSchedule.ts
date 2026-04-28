import type { AlarmDay, AlarmItem } from "@/alarm/types";

/** JS getDay(): Sun=0 … Sat=6 — maps to AlarmDay strings */
const JS_DAY_TO_ALARM_DAY: AlarmDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function matchesRepeatDays(date: Date, days: AlarmDay[]): boolean {
  if (!days.length) return true;
  const key = JS_DAY_TO_ALARM_DAY[date.getDay()];
  return days.includes(key);
}

/**
 * Next fire instant strictly after `now` (for “next alarm” UI).
 */
export function getNextOccurrenceAfterNow(alarm: AlarmItem, now: Date): Date | null {
  if (!alarm.enabled) return null;
  const h = alarm.rawTime.getHours();
  const min = alarm.rawTime.getMinutes();
  const nowMs = now.getTime();

  for (let delta = 0; delta < 370; delta++) {
    const cand = new Date(now);
    cand.setDate(cand.getDate() + delta);
    cand.setHours(h, min, 0, 0);
    cand.setMilliseconds(0);
    if (cand.getTime() <= nowMs) continue;
    if (!matchesRepeatDays(cand, alarm.days)) continue;
    return cand;
  }
  return null;
}

export type NextAlarmInfo = {
  alarm: AlarmItem;
  occursAt: Date;
};

export function getGloballyNextAlarm(alarms: AlarmItem[], now: Date): NextAlarmInfo | null {
  let best: NextAlarmInfo | null = null;
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const occursAt = getNextOccurrenceAfterNow(alarm, now);
    if (!occursAt) continue;
    if (!best || occursAt.getTime() < best.occursAt.getTime()) {
      best = { alarm, occursAt };
    }
  }
  return best;
}

/**
 * If we are inside [fireAt, fireAt + graceMs) for a matching repeat day, return that fireAt.
 * Used for auto-trigger (handles coarse intervals / slight delays).
 */
export function getAutoTriggerFireAtIfDue(
  alarm: AlarmItem,
  now: Date,
  graceMs: number
): Date | null {
  if (!alarm.enabled) return null;
  const h = alarm.rawTime.getHours();
  const min = alarm.rawTime.getMinutes();
  const nowMs = now.getTime();

  for (let dayBack = 0; dayBack <= 1; dayBack++) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayBack);
    d.setHours(h, min, 0, 0);
    d.setMilliseconds(0);
    if (!matchesRepeatDays(d, alarm.days)) continue;
    const start = d.getTime();
    const end = start + graceMs;
    if (nowMs >= start && nowMs < end) return d;
  }
  return null;
}
