export type SleepNightSummary = {
  /** Short range shown under the title, e.g. "Mon, Apr 28 · 11:02 PM – 6:48 AM" */
  windowLabel: string;
  totalSleepHours: number;
  timeInBedHours: number;
  stages: {
    deep: number;
    core: number;
    rem: number;
    awake: number;
    asleepOther: number;
    inBed: number;
  };
  heartRateAvg: number | null;
  heartRateMin: number | null;
};

export type SleepLoadFailureReason =
  | "unavailable"
  | "needs_auth"
  | "denied"
  | "no_data"
  | "error";

export type SleepLoadResult =
  | { ok: true; data: SleepNightSummary }
  | { ok: false; reason: SleepLoadFailureReason; message?: string };
