import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { appTheme } from "@/theme/appTheme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type AlarmEditorModalProps = {
  visible: boolean;
  title: string;
  tempTime: Date;
  onChangeTime: (d: Date) => void;
  showTimePicker: boolean;
  setShowTimePicker: (v: boolean) => void;
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  timeLabel: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
};

export function AlarmEditorModal({
  visible,
  title,
  tempTime,
  onChangeTime,
  showTimePicker,
  setShowTimePicker,
  selectedDays,
  onToggleDay,
  timeLabel,
  onCancel,
  onSave,
  saveLabel,
}: AlarmEditorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.modalTitle}>{title}</Text>

          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timeLink}>Time: {timeLabel}</Text>
          </TouchableOpacity>

          {showTimePicker ? (
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={(event, date) => {
                if (event.type === "set" && date) {
                  onChangeTime(date);
                }
                setShowTimePicker(false);
              }}
            />
          ) : null}

          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const selected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, selected && styles.daySelected]}
                  onPress={() => onToggleDay(day)}
                >
                  <Text
                    style={[styles.dayText, selected && styles.dayTextSelected]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave}>
              <Text style={styles.save}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: appTheme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: appTheme.colors.surface,
    padding: appTheme.space.lg,
    borderRadius: appTheme.radii.lg,
    width: "80%",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  modalTitle: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.text,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    marginBottom: 10,
  },
  timeLink: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
  },
  daysRow: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
  },
  dayPill: {
    backgroundColor: appTheme.colors.accentSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 5,
    marginTop: 5,
  },
  dayText: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accentMuted,
    fontSize: 11,
  },
  daySelected: {
    backgroundColor: appTheme.colors.accent,
  },
  dayTextSelected: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.background,
  },
  footer: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
    justifyContent: "flex-end",
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
