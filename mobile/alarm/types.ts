export const ALARM_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type AlarmDay = (typeof ALARM_DAYS)[number];

export type AlarmItem = {
  id: string;
  rawTime: Date;
  time: string;
  label: string;
  days: AlarmDay[];
  enabled: boolean;
};

export type AlarmLedSettings = {
  mode: "sunrise" | "custom";
  sunriseBrightness: number;
  sunriseDuration: number;
  snoozeDuration: number;
  customBrightness: number;
  customColor: string;
  mqttMsg: string | null;
};
