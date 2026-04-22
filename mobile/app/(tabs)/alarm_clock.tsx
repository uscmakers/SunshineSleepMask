import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
        <Switch
          value={alarm.enabled}
          onValueChange={() => toggle(alarm.id)}
          trackColor={{
            false: appTheme.colors.surfaceRow,
            true: appTheme.colors.accentSurface,
          }}
          thumbColor={alarm.enabled ? appTheme.colors.accent : "#888"}
        />
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => edit(alarm)} hitSlop={8}>
            <Text style={styles.actionBtn}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => remove(alarm.id)} hitSlop={8}>
            <Text style={styles.delete}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AlarmsScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={styles.listHead}>
      <ScreenHeader
        icon="clock-o"
        title="Alarms"
        subtitle="Set wake times and repeat days"
      />
    </View>
  );

  const listFooter = (
    <View style={{ marginTop: 8, marginBottom: insets.bottom + 24 }}>
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addText}>+ Add New Alarm</Text>
      </TouchableOpacity>
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
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: appTheme.space.screenPadding },
          ]}
          renderItem={({ item }) => (
            <AlarmCard
              alarm={item}
              toggle={toggleAlarm}
              remove={deleteAlarm}
              edit={startEditAlarm}
            />
          )}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Alarm" : "New Alarm"}
            </Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <Text style={styles.timeLink}>Time: {formatTime(tempTime)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (event.type === "set" && date) setTempTime(date);
                  setShowTimePicker(false);
                }}
              />
            )}
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
                  <Text
                    style={[
                      styles.dayText,
                      selectedDays.includes(day) && styles.dayTextOn,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveAlarm}>
                <Text style={styles.save}>
                  {editingId ? "Save Changes" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingTop: appTheme.space.md },
  list: { flex: 1 },
  listContent: { paddingBottom: 8 },
  listHead: { marginBottom: 8 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.border,
    borderWidth: 1,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.lg,
    marginBottom: appTheme.space.lg,
  },
  time: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.title,
    lineHeight: appTheme.type.titleLine,
    color: appTheme.colors.text,
  },
  label: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    marginTop: 4,
    fontSize: appTheme.type.label,
  },
  right: {
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 72,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 16 },
  actionBtn: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
    fontSize: 15,
  },
  delete: { color: appTheme.colors.textMuted, fontSize: 18 },
  addButton: {
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    borderStyle: "dashed",
    borderRadius: appTheme.radii.md,
    padding: 14,
    alignItems: "center",
    backgroundColor: appTheme.colors.background,
  },
  addText: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: appTheme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: appTheme.colors.surface,
    padding: appTheme.space.lg,
    borderRadius: appTheme.radii.lg,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  modalTitle: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.text,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    marginBottom: 12,
  },
  timeLink: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
  },
  daysRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 6 },
  dayPill: {
    backgroundColor: appTheme.colors.accentSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  dayText: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accentMuted,
    fontSize: 12,
  },
  daySelected: { backgroundColor: appTheme.colors.accent, borderColor: appTheme.colors.accent },
  dayTextOn: { color: appTheme.colors.background },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginTop: 20,
  },
  cancel: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.body,
  },
  save: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
    fontSize: appTheme.type.body,
  },
});
