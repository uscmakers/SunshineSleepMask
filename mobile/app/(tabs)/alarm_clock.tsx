import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  FlatList,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Alarm = {
  id: string;
  rawTime: Date;        // ✅ source of truth (24h)
  time: string;         // ✅ display only (AM/PM)
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

  if (
    weekends.every((d) => days.includes(d)) &&
    days.length === 2
  ) {
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

export default function AlarmsScreen() {
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

  // ======================
  // ACTIONS
  // ======================

  const openAddModal = () => {
    setEditingId(null);
    setTempTime(new Date());
    setSelectedDays([]);
    setModalVisible(true);
  };

  const startEditAlarm = (alarm: Alarm) => {
    setEditingId(alarm.id);
    setTempTime(new Date(alarm.rawTime)); // ✅ no parsing
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
      prev.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  // ======================
  // UI
  // ======================

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🕒</Text>
        <Text style={styles.title}>Alarms</Text>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            toggle={toggleAlarm}
            remove={deleteAlarm}
            edit={startEditAlarm}
          />
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addText}>+ Add New Alarm</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Alarm" : "New Alarm"}
            </Text>

            {/* TIME PICKER */}
            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: "#2dd4bf", fontSize: 18 }}>
                Time: {formatTime(tempTime)}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
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
            )}

            {/* DAYS */}
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

            {/* ACTIONS */}
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
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
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

  subtitle: {
    color: "#aaa",
    fontSize: 14,
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
    borderWidth: 1,
    borderColor: "#555",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },

  addText: {
    color: "#aaa",
  },

  infoBox: {
    marginTop: 15,
    backgroundColor: "#0f2a27",
    borderColor: "#1f5c56",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },

  infoText: {
    color: "#7ee7d7",
    fontSize: 13,
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