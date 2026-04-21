import type { AlarmCardModel } from "@/components/alarm/ExpandableAlarmCard";
import { formatAlarmTime, formatDaysLabel } from "@/utils/alarmFormat";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const initialAlarms: AlarmCardModel[] = [
  {
    id: "1",
    rawTime: new Date(2026, 0, 1, 7, 0),
    time: formatAlarmTime(new Date(2026, 0, 1, 7, 0)),
    label: "Weekdays",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    enabled: true,
    ledColor: "#FFC46B",
    ledBrightness: 75,
    sunriseSimulation: "gentle",
    sunriseDuration: 15,
    snoozeTime: 9,
  },
  {
    id: "2",
    rawTime: new Date(2026, 0, 1, 9, 0),
    time: formatAlarmTime(new Date(2026, 0, 1, 9, 0)),
    label: "Weekends",
    days: ["Sat", "Sun"],
    enabled: false,
    ledColor: "#7DD3C0",
    ledBrightness: 60,
    sunriseSimulation: "natural",
    sunriseDuration: 20,
    snoozeTime: 10,
  },
];

type AlarmScheduleContextValue = {
  alarms: AlarmCardModel[];
  setAlarms: React.Dispatch<React.SetStateAction<AlarmCardModel[]>>;
  updateAlarm: (id: string, patch: Partial<AlarmCardModel>) => void;
  addAlarm: (alarm: AlarmCardModel) => void;
  deleteAlarm: (id: string) => void;
};

const AlarmScheduleContext = createContext<AlarmScheduleContextValue | null>(
  null
);

export function AlarmScheduleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [alarms, setAlarms] = useState<AlarmCardModel[]>(initialAlarms);

  const updateAlarm = useCallback((id: string, patch: Partial<AlarmCardModel>) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }, []);

  const addAlarm = useCallback((alarm: AlarmCardModel) => {
    setAlarms((prev) => [...prev, alarm]);
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      alarms,
      setAlarms,
      updateAlarm,
      addAlarm,
      deleteAlarm,
    }),
    [alarms, updateAlarm, addAlarm, deleteAlarm]
  );

  return (
    <AlarmScheduleContext.Provider value={value}>
      {children}
    </AlarmScheduleContext.Provider>
  );
}

export function useAlarmSchedule() {
  const ctx = useContext(AlarmScheduleContext);
  if (!ctx) {
    throw new Error("useAlarmSchedule must be used within AlarmScheduleProvider");
  }
  return ctx;
}

export { formatAlarmTime, formatDaysLabel } from "@/utils/alarmFormat";
