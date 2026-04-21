import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlarmEditorModal } from "@/components/alarm/AlarmEditorModal";
import { AlarmRowCard, type AlarmListItem } from "@/components/alarm/AlarmRowCard";
import { SunriseSnoozePanels } from "@/components/alarm/SunriseSnoozePanels";
import { WakeColorPanel } from "@/components/alarm/WakeColorPanel";
import { AppScreen } from "@/components/ui/AppScreen";
import { sendColor } from "@/hooks/mqttClient";
import { useWakePreferences } from "@/providers/WakePreferencesContext";
import { appTheme } from "@/theme/appTheme";

const THROTTLE_INTERVAL_MS = 150;

type Alarm = AlarmListItem & {
  rawTime: Date;
  days: string[];
};

function formatTime(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDaysLabel(days: string[]) {
  if (days.length === 0) return "No repeat";
  if (days.length === 7) return "Every day";
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekends = ["Sat", "Sun"];
  if (
    weekdays.every((d) => days.includes(d)) &&
    !days.includes("Sat") &&
    !days.includes("Sun")
  ) {
    return "Weekdays";
  }
  if (weekends.every((d) => days.includes(d)) && days.length === 2) {
    return "Weekends";
  }
  return days.join(", ");
}

export default function AlarmScreen() {
  const insets = useSafeAreaInsets();
  const {
    wakeColorHex,
    setWakeColorHex,
    sunriseRampMinutes,
    setSunriseRampMinutes,
    snoozeMinutes,
    setSnoozeMinutes,
  } = useWakePreferences();

  const [alarms, setAlarms] = useState<Alarm[]>([
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
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const lastSentTimeRef = useRef<number>(0);
  const pendingColorRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      pendingColorRef.current = null;
    };
  }, []);

  const throttledSendColor = useCallback(
    (hex: string) => {
      setWakeColorHex(hex);
      pendingColorRef.current = hex;
      const now = Date.now();
      const timeSinceLastSend = now - lastSentTimeRef.current;
      if (timeSinceLastSend >= THROTTLE_INTERVAL_MS) {
        lastSentTimeRef.current = now;
        if (pendingColorRef.current) {
          sendColor(pendingColorRef.current);
          pendingColorRef.current = null;
        }
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
          if (pendingColorRef.current) {
            lastSentTimeRef.current = Date.now();
            sendColor(pendingColorRef.current);
            pendingColorRef.current = null;
          }
          timeoutRef.current = null;
        }, remainingTime);
      }
    },
    [setWakeColorHex]
  );

  const openAddModal = () => {
    setEditingId(null);
    setTempTime(new Date());
    setSelectedDays([]);
    setModalVisible(true);
  };

  const startEditAlarm = (alarm: Alarm) => {
    setEditingId(alarm.id);
    setTempTime(new Date(alarm.rawTime));
    setSelectedDays(alarm.days);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setSelectedDays([]);
    setShowTimePicker(false);
    setTempTime(new Date());
  };

  const saveAlarm = () => {
    const formatted = formatTime(tempTime);
    if (editingId) {
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                rawTime: tempTime,
                time: formatted,
                days: selectedDays,
                label: formatDaysLabel(selectedDays),
              }
            : a
        )
      );
    } else {
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        rawTime: tempTime,
        time: formatted,
        label: formatDaysLabel(selectedDays),
        days: selectedDays,
        enabled: true,
      };
      setAlarms((prev) => [...prev, newAlarm]);
    }
    closeModal();
  };

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <WakeColorPanel
        wakeColorHex={wakeColorHex}
        onSelectColorWorklet={throttledSendColor}
      />
      <SunriseSnoozePanels
        sunriseRampMinutes={sunriseRampMinutes}
        setSunriseRampMinutes={setSunriseRampMinutes}
        snoozeMinutes={snoozeMinutes}
        setSnoozeMinutes={setSnoozeMinutes}
      />
      <View style={styles.alarmListHeader}>
        <Text style={styles.headerIcon}>🕒</Text>
        <Text style={styles.listTitle}>Alarms</Text>
        <Text style={styles.syncHint}>
          ESP32 alarm sync (`alarms.replace_all`) comes next.
        </Text>
      </View>
    </View>
  );

  const bottomPad = insets.bottom + 72;

  return (
    <AppScreen scroll={false}>
      <View style={styles.flex}>
        <FlatList
          style={styles.list}
          data={alarms}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <AlarmRowCard
              alarm={item}
              onToggle={() => toggleAlarm(item.id)}
              onRemove={() => deleteAlarm(item.id)}
              onEdit={() => startEditAlarm(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: appTheme.space.xl, paddingBottom: bottomPad },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { bottom: 16 + insets.bottom, left: 20, right: 20 },
          ]}
          onPress={openAddModal}
        >
          <Text style={styles.addText}>+ Add New Alarm</Text>
        </TouchableOpacity>
      </View>

      <AlarmEditorModal
        visible={modalVisible}
        title={editingId ? "Edit Alarm" : "New Alarm"}
        tempTime={tempTime}
        onChangeTime={setTempTime}
        showTimePicker={showTimePicker}
        setShowTimePicker={setShowTimePicker}
        selectedDays={selectedDays}
        onToggleDay={toggleDay}
        timeLabel={formatTime(tempTime)}
        onCancel={closeModal}
        onSave={saveAlarm}
        saveLabel={editingId ? "Save Changes" : "Save"}
      />
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
  headerBlock: {
    marginBottom: 8,
  },
  alarmListHeader: {
    alignItems: "center",
    marginTop: appTheme.space.xxl,
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  listTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.screenTitle,
    lineHeight: appTheme.type.screenTitleLine,
    color: appTheme.colors.text,
  },
  syncHint: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textDim,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    marginTop: 6,
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    borderStyle: "dashed",
    borderRadius: appTheme.radii.md,
    padding: 12,
    alignItems: "center",
    backgroundColor: appTheme.colors.background,
  },
  addText: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
  },
});
