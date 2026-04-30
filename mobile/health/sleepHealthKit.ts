import type { SleepLoadResult } from "@/health/sleepHealthKit.types";

/** Android / web — Apple HealthKit is iOS-only. */
export async function loadLastNightSleep(): Promise<SleepLoadResult> {
  return {
    ok: false,
    reason: "unavailable",
    message: "Apple Health sleep data is available on iPhone with a development build.",
  };
}

export async function requestSleepAccess(): Promise<SleepLoadResult> {
  return loadLastNightSleep();
}
