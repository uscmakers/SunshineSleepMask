import DateTimePicker from "@react-native-community/datetimepicker";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, { Panel3 } from "reanimated-color-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlarmDay, AlarmItem, formatDaysLabel, formatTime, useAlarmContext } from "@/alarm/AlarmContext";
import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { initMqtt, sendAlarmSettings, sendColor } from "@/hooks/mqttClient";
import { appTheme } from "@/theme/appTheme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type AlarmMode = "sunrise" | "custom";
type AlarmLedSettings = {
  mode: AlarmMode;
  sunriseBrightness: number;
  sunriseDuration: number;
  snoozeDuration: number;
  customBrightness: number;
  customColor: string;
  mqttMsg: string | null;
};

type AlarmCardProps = {
  alarm: AlarmItem;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  edit: (alarm: AlarmItem) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  settings: AlarmLedSettings;
  onChangeSettings: (id: string, next: Partial<AlarmLedSettings>) => void;
  onTestSunrise: (id: string) => void;
  onTestCustomColor: (id: string) => void;
};

function AlarmCard({
  alarm,
  toggle,
  remove,
  edit,
  isExpanded,
  onToggleExpand,
  settings,
  onChangeSettings,
  onTestSunrise,
  onTestCustomColor,
}: AlarmCardProps) {
  const days = alarm.days.length ? alarm.days : DAYS;
  const colorPresets = ["#FF6B35", "#FFAA66", "#FFD166", "#14B8A6", "#60A5FA"];
  const previewAlpha = Math.max(0.2, settings.customBrightness);

  const onPickerSelect = ({ hex }: { hex: string }) => {
    "worklet";
    scheduleOnRN(onChangeSettings, alarm.id, { customColor: hex });
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View>
          <TouchableOpacity onPress={() => edit(alarm)} activeOpacity={0.8}>
            <Text style={styles.time}>{alarm.time}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controls}>
          <Switch
            value={alarm.enabled}
            onValueChange={() => toggle(alarm.id)}
            trackColor={{
              false: "#525252",
              true: "#525252",
            }}
            thumbColor={alarm.enabled ? appTheme.colors.accent : "#A3A3A3"}
          />
          <TouchableOpacity onPress={() => remove(alarm.id)} hitSlop={8}>
            <FontAwesome name="trash-o" size={20} color={appTheme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.daysWrap}>
        {days.map((day) => (
          <View key={`${alarm.id}-${day}`} style={styles.alarmDayPill}>
            <Text style={styles.alarmDayText}>{day}</Text>
          </View>
        ))}
      </View>
      <View style={styles.rowBottom}>
        <TouchableOpacity
          style={styles.ledButton}
          onPress={() => onToggleExpand(alarm.id)}
          activeOpacity={0.8}
        >
          <FontAwesome name="sun-o" size={16} color={appTheme.colors.accent} />
          <Text style={styles.ledText}>LED Settings</Text>
          <FontAwesome
            name="chevron-down"
            size={12}
            color={appTheme.colors.accent}
            style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.label}>{alarm.label}</Text>
        </View>
      </View>

      {isExpanded ? (
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Alarm Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => onChangeSettings(alarm.id, { mode: "sunrise" })}
              style={[styles.modeBtn, settings.mode === "sunrise" && styles.modeBtnOn]}
            >
              <Text style={[styles.modeText, settings.mode === "sunrise" && styles.modeTextOn]}>
                Sunrise Simulation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChangeSettings(alarm.id, { mode: "custom" })}
              style={[styles.modeBtn, settings.mode === "custom" && styles.modeBtnOn]}
            >
              <Text style={[styles.modeText, settings.mode === "custom" && styles.modeTextOn]}>
                Create My Own
              </Text>
            </TouchableOpacity>
          </View>

          {settings.mode === "sunrise" ? (
            <>
              <LabeledSlider
                label="LED Brightness"
                value={settings.sunriseBrightness}
                min={0}
                max={1}
                step={0.01}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onValueChange={(v) => onChangeSettings(alarm.id, { sunriseBrightness: v })}
              />
              <LabeledSlider
                label="Sunrise Duration"
                value={settings.sunriseDuration}
                min={5}
                max={45}
                step={1}
                formatValue={(v) => `${Math.round(v)} min`}
                onValueChange={(v) => onChangeSettings(alarm.id, { sunriseDuration: v })}
              />
              <LabeledSlider
                label="Snooze Duration"
                value={settings.snoozeDuration}
                min={1}
                max={30}
                step={1}
                formatValue={(v) => `${Math.round(v)} min`}
                onValueChange={(v) => onChangeSettings(alarm.id, { snoozeDuration: v })}
              />
              <TouchableOpacity style={styles.testBtn} onPress={() => onTestSunrise(alarm.id)}>
                <Text style={styles.testBtnText}>Test Simulation</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subLabel}>Color Presets</Text>
              <View style={styles.presetRow}>
                {colorPresets.map((hex) => (
                  <TouchableOpacity
                    key={hex}
                    onPress={() => onChangeSettings(alarm.id, { customColor: hex })}
                    style={[styles.preset, { backgroundColor: hex }]}
                  />
                ))}
              </View>
              <ColorPicker
                style={styles.colorPicker}
                value={settings.customColor}
                onChange={onPickerSelect}
              >
                <Panel3 />
              </ColorPicker>
              <Text style={styles.subLabel}>Selected Color: {settings.customColor}</Text>
              <LabeledSlider
                label="LED Brightness"
                value={settings.customBrightness}
                min={0}
                max={1}
                step={0.01}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onValueChange={(v) => onChangeSettings(alarm.id, { customBrightness: v })}
              />
              <View style={styles.previewRow}>
                <View
                  style={[
                    styles.previewDot,
                    {
                      backgroundColor: settings.customColor,
                      opacity: previewAlpha,
                      shadowColor: settings.customColor,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.previewDot,
                    {
                      backgroundColor: settings.customColor,
                      opacity: previewAlpha,
                      shadowColor: settings.customColor,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity style={styles.testBtn} onPress={() => onTestCustomColor(alarm.id)}>
                <Text style={styles.testBtnText}>Test Color</Text>
              </TouchableOpacity>
            </>
          )}
          {settings.mqttMsg ? <Text style={styles.mqttMsg}>{settings.mqttMsg}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export default function AlarmsScreen() {
  const insets = useSafeAreaInsets();
  const { alarms, deleteAlarm, toggleAlarm, upsertAlarm } = useAlarmContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<AlarmDay[]>([]);
  const [expandedAlarmId, setExpandedAlarmId] = useState<string | null>(null);
  const [alarmLedSettingsById, setAlarmLedSettingsById] = useState<Record<string, AlarmLedSettings>>(
    {}
  );

  const createDefaultLedSettings = (): AlarmLedSettings => ({
    mode: "sunrise",
    sunriseBrightness: 0.8,
    sunriseDuration: 20,
    snoozeDuration: 10,
    customBrightness: 0.8,
    customColor: "#FFAA66",
    mqttMsg: null,
  });

  useEffect(() => {
    initMqtt();
  }, []);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    setAlarmLedSettingsById((prev) => {
      const next: Record<string, AlarmLedSettings> = {};
      alarms.forEach((alarm) => {
        next[alarm.id] = prev[alarm.id] ?? createDefaultLedSettings();
      });
      return next;
    });
    setExpandedAlarmId((prev) => (prev && alarms.some((a) => a.id === prev) ? prev : null));
  }, [alarms]);

  const openAddModal = () => {
    setEditingId(null);
    setTempTime(new Date());
    setSelectedDays([]);
    setModalVisible(true);
  };

  const startEditAlarm = (alarm: AlarmItem) => {
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
    const base =
      editingId && alarms.find((a) => a.id === editingId)
        ? alarms.find((a) => a.id === editingId)!
        : null;
    upsertAlarm({
      id: editingId ?? Date.now().toString(),
      rawTime: tempTime,
      time: formatted,
      label: formatDaysLabel(selectedDays),
      days: selectedDays,
      enabled: base?.enabled ?? true,
    });
    closeModal();
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day as AlarmDay)
        ? prev.filter((d) => d !== day)
        : [...prev, day as AlarmDay]
    );
  };

  const toggleExpandedAlarm = (alarmId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAlarmId((prev) => (prev === alarmId ? null : alarmId));
  };

  const updateAlarmLedSettings = (alarmId: string, next: Partial<AlarmLedSettings>) => {
    setAlarmLedSettingsById((prev) => ({
      ...prev,
      [alarmId]: { ...(prev[alarmId] ?? createDefaultLedSettings()), ...next },
    }));
  };

  const testSunrise = (alarmId: string) => {
    const s = alarmLedSettingsById[alarmId] ?? createDefaultLedSettings();
    const ok = sendAlarmSettings(s.sunriseDuration, s.sunriseBrightness);
    updateAlarmLedSettings(alarmId, {
      mqttMsg: ok ? "Sunrise simulation sent to mask." : "Mask not connected yet.",
    });
  };

  const testCustomColor = (alarmId: string) => {
    const s = alarmLedSettingsById[alarmId] ?? createDefaultLedSettings();
    sendColor(s.customColor);
    updateAlarmLedSettings(alarmId, { mqttMsg: "Custom color test sent to mask." });
  };

  const listHeader = (
    <View style={styles.listHead}>
      <ScreenHeader
        icon="clock-o"
        title="Alarms"
        subtitle="Manage your wake-up alarms"
      />
    </View>
  );

  const listFooter = (
    <View style={{ marginTop: 8, marginBottom: insets.bottom + 24 }}>
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addText}>+ Add New Alarm</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Click "LED Settings" on any alarm to customize the sunrise simulation.
      </Text>
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
              isExpanded={expandedAlarmId === item.id}
              onToggleExpand={toggleExpandedAlarm}
              settings={alarmLedSettingsById[item.id] ?? createDefaultLedSettings()}
              onChangeSettings={updateAlarmLedSettings}
              onTestSunrise={testSunrise}
              onTestCustomColor={testCustomColor}
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
                    selectedDays.includes(day as AlarmDay) && styles.daySelected,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDays.includes(day as AlarmDay) && styles.dayTextOn,
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
    backgroundColor: appTheme.colors.surface,
    borderColor: "rgba(0,187,167,0.3)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 28,
    lineHeight: 34,
    color: appTheme.colors.text,
  },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  daysWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  alarmDayPill: {
    backgroundColor: appTheme.colors.accentTint,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alarmDayText: {
    color: appTheme.colors.accent,
    fontFamily: appTheme.fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  rowBottom: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ledButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  ledText: {
    color: appTheme.colors.accent,
    fontFamily: appTheme.fonts.medium,
    fontSize: 28 / 2,
    lineHeight: 20,
  },
  label: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: 13,
  },
  addButton: {
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    backgroundColor: appTheme.colors.background,
  },
  addText: {
    fontFamily: appTheme.fonts.regular,
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.type.body,
  },
  hint: {
    marginTop: 14,
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
  modeCard: {
    marginTop: 12,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    padding: 16,
  },
  modeTitle: { color: appTheme.colors.text, fontFamily: appTheme.fonts.medium, fontSize: 16 },
  modeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeBtnOn: { backgroundColor: appTheme.colors.accentTint, borderColor: appTheme.colors.accentBorderSoft },
  modeText: { color: appTheme.colors.textSecondary, fontSize: 13, fontFamily: appTheme.fonts.medium },
  modeTextOn: { color: appTheme.colors.accent },
  testBtn: {
    backgroundColor: appTheme.colors.accentTint,
    borderWidth: 1,
    borderColor: appTheme.colors.accentBorderSoft,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  testBtnText: { color: appTheme.colors.accent, fontFamily: appTheme.fonts.medium, fontSize: 14 },
  subLabel: { color: appTheme.colors.textSecondary, fontSize: 13, marginBottom: 8 },
  presetRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  preset: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: appTheme.colors.borderInner },
  colorPicker: { width: "100%", marginBottom: 12 },
  previewRow: { flexDirection: "row", gap: 20, justifyContent: "center", marginBottom: 12 },
  previewDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  summaryText: { marginTop: 8, color: appTheme.colors.text, fontSize: 14 },
  summarySub: { marginTop: 6, color: appTheme.colors.textSecondary, fontSize: 13 },
  mqttMsg: { marginTop: 8, color: appTheme.colors.accent, fontFamily: appTheme.fonts.medium, fontSize: 12 },
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
