import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, {
  BrightnessSlider,
  Panel3,
  Preview,
} from "reanimated-color-picker";

import { sendColor } from "@/hooks/mqttClient";
import { useWakePreferences } from "@/providers/WakePreferencesContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RAMP_OPTIONS = [5, 10, 15, 20, 30];
const SNOOZE_OPTIONS = [5, 9, 10, 15];
const THROTTLE_INTERVAL_MS = 150;

type Alarm = {
  id: string;
  rawTime: Date;
  time: string;
  label: string;
  days: string[];
  enabled: boolean;
};

type AlarmCardProps = {
  alarm: Alarm;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  edit: (alarm: Alarm) => void;
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

function AlarmCard({ alarm, toggle, remove, edit }: AlarmCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.time}>{alarm.time}</Text>
        <Text style={styles.label}>{alarm.label}</Text>
      </View>

      <View style={styles.right}>
        <Switch value={alarm.enabled} onValueChange={() => toggle(alarm.id)} />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={() => edit(alarm)}>
            <Text style={{ color: "#2dd4bf", fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => remove(alarm.id)}>
            <Text style={styles.delete}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AlarmScreen() {
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

  const onSelectColor = ({ hex }: { hex: string }) => {
    "worklet";
    scheduleOnRN(throttledSendColor, hex);
  };

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
      <Text style={styles.sectionHeading}>Wake-up light</Text>
      <Text style={styles.sectionSub}>
        Pick the color the mask uses at the end of the sunrise ramp (MQTT v1 +
        legacy publish).
      </Text>

      <ColorPicker
        style={{ width: "100%", gap: 10, marginTop: 8 }}
        value={wakeColorHex}
        onChange={onSelectColor}
      >
        <Panel3 />
        <BrightnessSlider />
        <Preview hideInitialColor />
      </ColorPicker>

      <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
        Sunrise length
      </Text>
      <View style={styles.chipRow}>
        {RAMP_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.chip,
              sunriseRampMinutes === m && styles.chipSelected,
            ]}
            onPress={() => setSunriseRampMinutes(m)}
          >
            <Text
              style={[
                styles.chipText,
                sunriseRampMinutes === m && styles.chipTextSelected,
              ]}
            >
              {m} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Snooze</Text>
      <View style={styles.chipRow}>
        {SNOOZE_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, snoozeMinutes === m && styles.chipSelected]}
            onPress={() => setSnoozeMinutes(m)}
          >
            <Text
              style={[
                styles.chipText,
                snoozeMinutes === m && styles.chipTextSelected,
              ]}
            >
              {m} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.alarmListHeader}>
        <Text style={styles.headerIcon}>🕒</Text>
        <Text style={styles.title}>Alarms</Text>
        <Text style={styles.syncHint}>
          ESP32 alarm sync (`alarms.replace_all`) comes next.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            toggle={toggleAlarm}
            remove={deleteAlarm}
            edit={startEditAlarm}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addText}>+ Add New Alarm</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Alarm" : "New Alarm"}
            </Text>

            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: "#2dd4bf", fontSize: 18 }}>
                Time: {formatTime(tempTime)}
              </Text>
            </TouchableOpacity>

            {showTimePicker ? (
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (event.type === "set" && date) {
                    setTempTime(date);
                  }
                  setShowTimePicker(false);
                }}
              />
            ) : null}

            <View style={styles.daysRow}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPill,
                    selectedDays.includes(day) && styles.daySelected,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={styles.dayText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 20, marginTop: 10 }}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={{ color: "#aaa" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveAlarm}>
                <Text style={{ color: "#2dd4bf" }}>
                  {editingId ? "Save Changes" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  headerBlock: {
    marginBottom: 8,
  },
  sectionHeading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSub: {
    color: "#888",
    fontSize: 13,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  chipSelected: {
    backgroundColor: "#1f3d3a",
    borderColor: "#2dd4bf",
  },
  chipText: {
    color: "#aaa",
    fontSize: 14,
  },
  chipTextSelected: {
    color: "#2dd4bf",
    fontWeight: "600",
  },
  alarmListHeader: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  syncHint: {
    color: "#666",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#111",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  time: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  label: {
    color: "#aaa",
    marginTop: 4,
    fontSize: 13,
  },
  right: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  delete: {
    color: "#aaa",
    fontSize: 18,
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderColor: "#555",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#000",
  },
  addText: {
    color: "#aaa",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 16,
    width: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
  },
  dayPill: {
    backgroundColor: "#1f3d3a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 5,
    marginTop: 5,
  },
  dayText: {
    color: "#7ee7d7",
    fontSize: 11,
  },
  daySelected: {
    backgroundColor: "#2dd4bf",
  },
});
