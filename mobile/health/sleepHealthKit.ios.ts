import {
  AuthorizationStatus,
  CategoryValueSleepAnalysis,
  authorizationStatusFor,
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryQuantitySamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

import type { SleepLoadResult, SleepNightSummary } from "@/health/sleepHealthKit.types";

const SLEEP_CATEGORY = "HKCategoryTypeIdentifierSleepAnalysis" as const;
const HEART_RATE = "HKQuantityTypeIdentifierHeartRate" as const;

const READ_TYPES = [SLEEP_CATEGORY, HEART_RATE] as const;

function sleepQueryWindow(now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);
  return { start, end };
}

function hoursBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}

function formatWindowLabel(start: Date, end: Date): string {
  const dayFmt: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${start.toLocaleDateString(undefined, dayFmt)} · ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`;
}

function isAsleepValue(v: number): boolean {
  return (
    v === CategoryValueSleepAnalysis.asleep ||
    v === CategoryValueSleepAnalysis.asleepUnspecified ||
    v === CategoryValueSleepAnalysis.asleepCore ||
    v === CategoryValueSleepAnalysis.asleepDeep ||
    v === CategoryValueSleepAnalysis.asleepREM
  );
}

export async function loadLastNightSleep(): Promise<SleepLoadResult> {
  try {
    if (!(await isHealthDataAvailableAsync())) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Health data is not available on this device.",
      };
    }

    const sleepAuth = authorizationStatusFor(SLEEP_CATEGORY);
    if (sleepAuth === AuthorizationStatus.notDetermined) {
      return { ok: false, reason: "needs_auth" };
    }
    if (sleepAuth === AuthorizationStatus.sharingDenied) {
      return {
        ok: false,
        reason: "denied",
        message: "Allow Health access in Settings › Privacy › Health › SunshineSleepMask.",
      };
    }

    const { start: winStart, end: winEnd } = sleepQueryWindow(new Date());
    const samples = await queryCategorySamples(SLEEP_CATEGORY, {
      filter: { date: { startDate: winStart, endDate: winEnd } },
      limit: -1,
      ascending: true,
    });

    if (!samples.length) {
      return {
        ok: false,
        reason: "no_data",
        message: "No sleep samples in Apple Health for the last night. Wear your Apple Watch to bed or check the Health app.",
      };
    }

    const stages = {
      deep: 0,
      core: 0,
      rem: 0,
      awake: 0,
      asleepOther: 0,
      inBed: 0,
    };

    let boundsStart: Date | null = null;
    let boundsEnd: Date | null = null;

    for (const s of samples) {
      const h = hoursBetween(s.startDate, s.endDate);
      const v = s.value as number;
      if (v === CategoryValueSleepAnalysis.inBed) {
        stages.inBed += h;
      } else if (v === CategoryValueSleepAnalysis.asleepDeep) {
        stages.deep += h;
      } else if (v === CategoryValueSleepAnalysis.asleepCore) {
        stages.core += h;
      } else if (v === CategoryValueSleepAnalysis.asleepREM) {
        stages.rem += h;
      } else if (v === CategoryValueSleepAnalysis.awake) {
        stages.awake += h;
      } else if (
        v === CategoryValueSleepAnalysis.asleep ||
        v === CategoryValueSleepAnalysis.asleepUnspecified
      ) {
        stages.asleepOther += h;
      }

      if (v === CategoryValueSleepAnalysis.inBed || isAsleepValue(v)) {
        if (!boundsStart || s.startDate < boundsStart) boundsStart = s.startDate;
        if (!boundsEnd || s.endDate > boundsEnd) boundsEnd = s.endDate;
      }
    }

    const totalSleepHours = stages.deep + stages.core + stages.rem + stages.asleepOther;
    const timeInBedHours =
      boundsStart && boundsEnd
        ? hoursBetween(boundsStart, boundsEnd)
        : stages.inBed + totalSleepHours + stages.awake;

    const hrStart = boundsStart ?? winStart;
    const hrEnd = boundsEnd ?? winEnd;

    let heartRateAvg: number | null = null;
    let heartRateMin: number | null = null;
    try {
      const hrSamples = await queryQuantitySamples(HEART_RATE, {
        filter: { date: { startDate: hrStart, endDate: hrEnd } },
        limit: -1,
        ascending: true,
        unit: "count/min",
      });
      if (hrSamples.length) {
        let sum = 0;
        let min = Number.POSITIVE_INFINITY;
        for (const q of hrSamples) {
          sum += q.quantity;
          if (q.quantity < min) min = q.quantity;
        }
        heartRateAvg = sum / hrSamples.length;
        heartRateMin = Number.isFinite(min) ? min : null;
      }
    } catch {
      /* optional */
    }

    const labelStart = boundsStart ?? samples[0].startDate;
    const labelEnd = boundsEnd ?? samples[samples.length - 1].endDate;

    const data: SleepNightSummary = {
      windowLabel: formatWindowLabel(labelStart, labelEnd),
      totalSleepHours,
      timeInBedHours: timeInBedHours > 0 ? timeInBedHours : totalSleepHours,
      stages,
      heartRateAvg,
      heartRateMin,
    };

    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "Could not read Apple Health data.",
    };
  }
}

export async function requestSleepAccess(): Promise<SleepLoadResult> {
  try {
    if (!(await isHealthDataAvailableAsync())) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Health data is not available on this device.",
      };
    }
    await requestAuthorization({ toRead: [...READ_TYPES] });
    return loadLastNightSleep();
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "Health authorization failed.",
    };
  }
}
