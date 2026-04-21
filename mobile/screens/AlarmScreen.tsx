import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ExpandableAlarmCard,
  type AlarmCardModel,
} from "@/components/alarm/ExpandableAlarmCard";
import { SunriseSnoozePanels } from "@/components/alarm/SunriseSnoozePanels";
import { WakeColorPanel } from "@/components/alarm/WakeColorPanel";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sendColor } from "@/hooks/mqttClient";
import {
  formatAlarmTime,
  formatDaysLabel,
  useAlarmSchedule,
} from "@/providers/AlarmScheduleContext";
import { useWakePreferences } from "@/providers/WakePreferencesContext";
import { appTheme } from "@/theme/appTheme";

const THROTTLE_INTERVAL_MS = 150;

export default function AlarmScreen() {
  const insets = useSafeAreaInsets();
  const {
    defaultWakeColorHex,
    setDefaultWakeColorHex,
    defaultSunriseRampMinutes,
    setDefaultSunriseRampMinutes,
    defaultSnoozeMinutes,
    setDefaultSnoozeMinutes,
  } = useWakePreferences();

  const { alarms, setAlarms, addAlarm, deleteAlarm, updateAlarm } =
    useAlarmSchedule();

  const alarmsRef = useRef(alarms);
  alarmsRef.current = alarms;

  const [expandedId, setExpandedId] = useState<string | null>("1");
  const expandedIdRef = useRef<string | null>(expandedId);
  expandedIdRef.current = expandedId;

  const lastSentTimeRef = useRef<number>(0);
  const pendingRef = useRef<{ hex: string; brightness: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      pendingRef.current = null;
    };
  }, []);

  const flushPendingColor = useCallback(() => {
    if (pendingRef.current) {
      const { hex, brightness } = pendingRef.current;
      sendColor(hex, brightness);
      pendingRef.current = null;
    }
  }, []);

  const throttledSendColor = useCallback(
    (hex: string, brightnessPct: number) => {
      const brightness = Math.min(1, Math.max(0, brightnessPct / 100));
      pendingRef.current = { hex, brightness };
      const now = Date.now();
      const timeSinceLastSend = now - lastSentTimeRef.current;
      if (timeSinceLastSend >= THROTTLE_INTERVAL_MS) {
        lastSentTimeRef.current = now;
        flushPendingColor();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        const remainingTime = THROTTLE_INTERVAL_MS - timeSinceLastSend;
        timeoutRef.current = setTimeout(() => {
          lastSentTimeRef.current = Date.now();
          flushPendingColor();
          timeoutRef.current = null;
        }, remainingTime);
      }
    },
    [flushPendingColor]
  );

  const onColorPick = useCallback(
    (hex: string) => {
      const id = expandedIdRef.current;
      if (!id) return;
      const brightness =
        alarmsRef.current.find((a) => a.id === id)?.ledBrightness ?? 75;
      setAlarms((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ledColor: hex } : a))
      );
      throttledSendColor(hex, brightness);
    },
    [setAlarms, throttledSendColor]
  );

  const openAddAlarm = () => {
    const raw = new Date();
    raw.setHours(7, 0, 0, 0);
    const id = `${Date.now()}`;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    addAlarm({
      id,
      rawTime: raw,
      time: formatAlarmTime(raw),
      label: formatDaysLabel(days),
      days,
      enabled: true,
      ledColor: defaultWakeColorHex,
      ledBrightness: 75,
      sunriseSimulation: "gentle",
      sunriseDuration: defaultSunriseRampMinutes,
      snoozeTime: defaultSnoozeMinutes,
    });
    setExpandedId(id);
  };

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const removeAlarm = (id: string) => {
    deleteAlarm(id);
    setExpandedId((cur) => (cur === id ? null : cur));
  };

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const bottomPad = insets.bottom + 88;

  const listHeader = (
    <View>
      <ScreenHeader
        icon="clock-o"
        title="Alarms"
        subtitle="Configure your wake-up lights and sounds"
      />
      <View style={styles.defaultsCard}>
        <SectionHeader
          title="Defaults for new alarms"
          hint="Sunrise length, snooze, and color here only seed the next alarm you add. Open an alarm below to change that alarm only."
        />
        <SunriseSnoozePanels
          sunriseRampMinutes={defaultSunriseRampMinutes}
          setSunriseRampMinutes={setDefaultSunriseRampMinutes}
          snoozeMinutes={defaultSnoozeMinutes}
          setSnoozeMinutes={setDefaultSnoozeMinutes}
        />
        <WakeColorPanel
          wakeColorHex={defaultWakeColorHex}
          onSelectColorWorklet={setDefaultWakeColorHex}
          title="Default wake color"
          hint="Starting LED color for new alarms. Does not change existing alarms or preview on the mask until you edit an alarm."
        />
      </View>
    </View>
  );

  const listFooter = (
    <View>
      <TouchableOpacity style={styles.addDashed} onPress={openAddAlarm}>
        <Text style={styles.addText}>+ Add New Alarm</Text>
      </TouchableOpacity>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Device sync</Text>
        <Text style={styles.infoBody}>
          Alarm schedules use MQTT v1 `alarms.replace_all` when firmware is ready.
          Color and brightness previews publish to `downlink/color` from an expanded
          alarm.
        </Text>
      </View>
    </View>
  );

  return (
    <AppScreen scroll={false}>
      <View style={styles.flex}>
        <FlatList
          style={styles.list}
          data={alarms}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderItem={({ item }) => (
            <ExpandableAlarmCard
              alarm={item}
              expanded={expandedId === item.id}
              onToggleExpand={() => toggleExpand(item.id)}
              onToggleEnabled={() => toggleAlarm(item.id)}
              onRemove={() => removeAlarm(item.id)}
              onChangeScheduleTime={(d) => {
                updateAlarm(item.id, {
                  rawTime: d,
                  time: formatAlarmTime(d),
                });
              }}
              onToggleScheduleDay={(day) => {
                const cur = alarmsRef.current.find((a) => a.id === item.id);
                if (!cur) return;
                const nextDays = cur.days.includes(day)
                  ? cur.days.filter((x) => x !== day)
                  : [...cur.days, day];
                updateAlarm(item.id, {
                  days: nextDays,
                  label: formatDaysLabel(nextDays),
                });
              }}
              onChangeLedColor={(hex) => {
                setAlarms((prev) =>
                  prev.map((a) =>
                    a.id === item.id ? { ...a, ledColor: hex } : a
                  )
                );
                const br =
                  alarmsRef.current.find((a) => a.id === item.id)
                    ?.ledBrightness ?? 75;
                throttledSendColor(hex, br);
              }}
              onChangeLedBrightness={(pct) => {
                setAlarms((prev) =>
                  prev.map((a) =>
                    a.id === item.id ? { ...a, ledBrightness: pct } : a
                  )
                );
              }}
              onSlidingCompleteBrightness={(pct) => {
                const hex =
                  alarmsRef.current.find((a) => a.id === item.id)?.ledColor ??
                  defaultWakeColorHex;
                throttledSendColor(hex, pct);
              }}
              onChangePattern={(p) => {
                updateAlarm(item.id, { sunriseSimulation: p });
              }}
              onChangeSunriseDuration={(m) => {
                updateAlarm(item.id, { sunriseDuration: m });
              }}
              onChangeSnoozeTime={(m) => {
                updateAlarm(item.id, { snoozeTime: m });
              }}
              onColorPick={onColorPick}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: appTheme.space.screenPadding,
              paddingBottom: bottomPad,
            },
          ]}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    paddingTop: appTheme.space.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 0,
  },
  defaultsCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.space.cardPadding,
    marginBottom: appTheme.space.sectionGap,
  },
  addDashed: {
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    borderStyle: "dashed",
    borderRadius: appTheme.radii.md,
    padding: 14,
    alignItems: "center",
    backgroundColor: appTheme.colors.background,
    marginBottom: appTheme.space.lg,
  },
  addText: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.body,
  },
  infoCard: {
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: appTheme.space.lg,
    marginBottom: appTheme.space.xxl,
  },
  infoTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.body,
    color: appTheme.colors.text,
    marginBottom: 6,
  },
  infoBody: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textSecondary,
  },
});
