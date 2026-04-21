import type { AlarmCardModel } from "@/components/alarm/ExpandableAlarmCard";

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function patternLabel(p: AlarmCardModel["sunriseSimulation"]): string {
  switch (p) {
    case "gentle":
      return "Gentle";
    case "natural":
      return "Natural";
    case "energize":
      return "Energize";
    default:
      return "Sunrise";
  }
}

/** Next fire strictly after `from` on the calendar day of `probe` (local) with wall time from `rawTime`. */
function atLocalTime(probe: Date, rawTime: Date): Date {
  return new Date(
    probe.getFullYear(),
    probe.getMonth(),
    probe.getDate(),
    rawTime.getHours(),
    rawTime.getMinutes(),
    0,
    0
  );
}

/**
 * Picks the enabled alarm that fires next (local clock, weekly repeat by weekday abbrev).
 * Returns null if none.
 */
export function getNextActiveAlarm(
  alarms: AlarmCardModel[],
  from: Date = new Date()
): AlarmCardModel | null {
  const candidates = alarms.filter(
    (a) => a.enabled && Array.isArray(a.days) && a.days.length > 0
  );
  if (candidates.length === 0) return null;

  let best: { alarm: AlarmCardModel; when: number } | null = null;
  const fromMs = from.getTime();

  for (const alarm of candidates) {
    const jsDays = alarm.days
      .map((d) => DAY_MAP[d])
      .filter((n) => typeof n === "number");

    if (jsDays.length === 0) continue;

    for (let offset = 0; offset < 14; offset++) {
      const probe = new Date(from);
      probe.setDate(probe.getDate() + offset);
      const dow = probe.getDay();
      if (!jsDays.includes(dow)) continue;

      const fire = atLocalTime(probe, alarm.rawTime);
      if (fire.getTime() <= fromMs) continue;

      if (!best || fire.getTime() < best.when) {
        best = { alarm, when: fire.getTime() };
      }
    }
  }

  return best?.alarm ?? null;
}

export function formatNextAlarmSummary(alarm: AlarmCardModel): string {
  const timeStr =
    alarm.time ||
    `${alarm.rawTime.getHours()}:${alarm.rawTime.getMinutes().toString().padStart(2, "0")}`;
  return `${timeStr} • ${patternLabel(alarm.sunriseSimulation)} sunrise (${alarm.sunriseDuration} min)`;
}

export function nextAlarmSummaryLine(alarms: AlarmCardModel[]): string {
  const next = getNextActiveAlarm(alarms);
  if (!next) return "No upcoming alarm — enable an alarm with repeat days";
  return formatNextAlarmSummary(next);
}
