import DateTimePicker from "@react-native-community/datetimepicker";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { scheduleOnRN } from "react-native-worklets";
import ColorPicker, { Panel3, Preview } from "reanimated-color-picker";

import type { AlarmListItem } from "@/components/alarm/AlarmRowCard";
import { appTheme } from "@/theme/appTheme";

export type AlarmCardModel = AlarmListItem & {
  rawTime: Date;
  days: string[];
  ledColor: string;
  /** 0–100; maps to MQTT `brightness` 0–1 when previewing on device. */
  ledBrightness: number;
  sunriseSimulation: "gentle" | "natural" | "energize";
  sunriseDuration: number;
  snoozeTime: number;
};

const LED_PRESETS = [
  "#FFC46B",
  "#FF8FB2",
  "#7DD3C0",
  "#A78BFA",
  "#FB7185",
] as const;

const SCHEDULE_DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

type ExpandableAlarmCardProps = {
  alarm: AlarmCardModel;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onRemove: () => void;
  onChangeScheduleTime: (d: Date) => void;
  onToggleScheduleDay: (day: string) => void;
  onChangeLedColor: (hex: string) => void;
  onChangeLedBrightness: (pct: number) => void;
  onSlidingCompleteBrightness: (pct: number) => void;
  onChangePattern: (p: AlarmCardModel["sunriseSimulation"]) => void;
  onChangeSunriseDuration: (minutes: number) => void;
  onChangeSnoozeTime: (minutes: number) => void;
  /** Called from color-picker worklet via `scheduleOnRN`. */
  onColorPick: (hex: string) => void;
};

export function ExpandableAlarmCard({
  alarm,
  expanded,
  onToggleExpand,
  onToggleEnabled,
  onRemove,
  onChangeScheduleTime,
  onToggleScheduleDay,
  onChangeLedColor,
  onChangeLedBrightness,
  onSlidingCompleteBrightness,
  onChangePattern,
  onChangeSunriseDuration,
  onChangeSnoozeTime,
  onColorPick,
}: ExpandableAlarmCardProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onPickerColor = ({ hex }: { hex: string }) => {
    "worklet";
    scheduleOnRN(onColorPick, hex);
  };

  const rgb = hexToRgb(alarm.ledColor);
  const previewSoft = rgb
    ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`
    : "rgba(255,255,255,0.2)";
  const previewStrong = rgb
    ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.85)`
    : appTheme.colors.accent;

  const onPressTimeArea = () => {
    if (!expanded) {
      onToggleExpand();
      return;
    }
    setShowTimePicker(true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable style={styles.topMain} onPress={onPressTimeArea}>
          <View style={styles.timeBlock}>
            <Text style={styles.time}>{alarm.time}</Text>
            <Text style={styles.label}>{alarm.label}</Text>
          </View>
        </Pressable>
        <Pressable onPress={onToggleExpand} hitSlop={8} style={styles.chevronHit}>
          <FontAwesome
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={appTheme.colors.textMuted}
          />
        </Pressable>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggleEnabled}
          trackColor={{
            false: appTheme.colors.surfaceRow,
            true: appTheme.colors.accentSurface,
          }}
          thumbColor={alarm.enabled ? appTheme.colors.accent : "#888"}
        />
      </View>

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.expandedHead}>
            <Text style={styles.sectionTitle}>Edit alarm</Text>
            <TouchableOpacity onPress={onRemove} hitSlop={10}>
              <FontAwesome name="trash" size={18} color={appTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.scopeHint}>
            Schedule, light, ramp, and snooze below apply only to this alarm.
          </Text>

          <Text style={styles.fieldLabel}>Schedule</Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timeLink}>Time: {alarm.time}</Text>
          </TouchableOpacity>
          {showTimePicker ? (
            <DateTimePicker
              value={alarm.rawTime}
              mode="time"
              display="spinner"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (event.type === "set" && date) {
                  onChangeScheduleTime(date);
                }
              }}
            />
          ) : null}

          <View style={styles.daysRow}>
            {SCHEDULE_DAYS.map((day) => {
              const selected = alarm.days.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, selected && styles.daySelected]}
                  onPress={() => onToggleScheduleDay(day)}
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

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>LED wake color</Text>
          <View style={styles.presetRow}>
            {LED_PRESETS.map((c) => {
              const active = alarm.ledColor.toLowerCase() === c.toLowerCase();
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => onChangeLedColor(c)}
                  style={[
                    styles.presetDot,
                    { backgroundColor: c },
                    active && styles.presetDotActive,
                  ]}
                  accessibilityLabel={`Preset color ${c}`}
                />
              );
            })}
          </View>

          <ColorPicker
            style={styles.picker}
            value={alarm.ledColor}
            onChange={onPickerColor}
          >
            <Panel3 />
            <Preview hideInitialColor />
          </ColorPicker>

          <Text style={styles.fieldLabel}>Brightness</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={100}
            step={1}
            value={alarm.ledBrightness}
            onValueChange={onChangeLedBrightness}
            onSlidingComplete={onSlidingCompleteBrightness}
            minimumTrackTintColor={appTheme.colors.accent}
            maximumTrackTintColor={appTheme.colors.borderInner}
            thumbTintColor={appTheme.colors.text}
          />
          <View style={styles.previewRow}>
            <View style={[styles.orb, { backgroundColor: previewSoft }]} />
            <View style={[styles.orb, { backgroundColor: previewStrong }]} />
          </View>

          <Text style={styles.fieldLabel}>Sunrise simulation</Text>
          <View style={styles.patternRow}>
            {(
              [
                ["gentle", "Gentle"],
                ["natural", "Natural"],
                ["energize", "Energize"],
              ] as const
            ).map(([key, label]) => {
              const on = alarm.sunriseSimulation === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => onChangePattern(key)}
                  style={[styles.patternChip, on && styles.patternChipOn]}
                >
                  <Text style={[styles.patternText, on && styles.patternTextOn]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sliderLabelRow}>
            <Text style={styles.fieldLabel}>Sunrise duration</Text>
            <Text style={styles.sliderValue}>{alarm.sunriseDuration} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={45}
            step={1}
            value={alarm.sunriseDuration}
            onValueChange={onChangeSunriseDuration}
            minimumTrackTintColor={appTheme.colors.accent}
            maximumTrackTintColor={appTheme.colors.borderInner}
            thumbTintColor={appTheme.colors.text}
          />

          <View style={styles.sliderLabelRow}>
            <Text style={styles.fieldLabel}>Snooze time</Text>
            <Text style={styles.sliderValue}>{alarm.snoozeTime} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={alarm.snoozeTime}
            onValueChange={onChangeSnoozeTime}
            minimumTrackTintColor={appTheme.colors.accent}
            maximumTrackTintColor={appTheme.colors.borderInner}
            thumbTintColor={appTheme.colors.text}
          />

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryStrong}>Time:</Text> {alarm.time}
            </Text>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryStrong}>Light:</Text>{" "}
              {alarm.ledBrightness}% • {alarm.sunriseSimulation}
            </Text>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() =>
                Alert.alert(
                  "Test simulation",
                  "Firmware-driven wake simulation is not wired in this build. Use the color preview above to validate MQTT color + brightness."
                )
              }
            >
              <Text style={styles.testBtnText}>Test Simulation</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.border,
    borderWidth: 1,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.lg,
    marginBottom: appTheme.space.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  timeBlock: {
    flex: 1,
    minWidth: 0,
  },
  chevronHit: {
    padding: 4,
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
    lineHeight: appTheme.type.labelLine,
  },
  expanded: {
    marginTop: appTheme.space.lg,
    paddingTop: appTheme.space.lg,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.borderInner,
  },
  expandedHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: appTheme.space.sm,
  },
  sectionTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.section,
    lineHeight: appTheme.type.sectionLine,
    color: appTheme.colors.text,
  },
  scopeHint: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    lineHeight: appTheme.type.captionLine,
    color: appTheme.colors.textMuted,
    marginBottom: appTheme.space.md,
  },
  fieldLabel: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  timeLink: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.accent,
    fontSize: appTheme.type.h3,
    lineHeight: appTheme.type.h3Line,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 6,
  },
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
  daySelected: {
    backgroundColor: appTheme.colors.accent,
    borderColor: appTheme.colors.accent,
  },
  dayTextSelected: {
    color: appTheme.colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: appTheme.colors.borderInner,
    marginVertical: appTheme.space.lg,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  presetDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetDotActive: {
    borderColor: appTheme.colors.accent,
  },
  picker: {
    width: "100%",
    gap: 10,
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  orb: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  patternRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  patternChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: appTheme.radii.pill,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    backgroundColor: appTheme.colors.surfaceRow,
  },
  patternChipOn: {
    borderColor: appTheme.colors.accent,
    backgroundColor: appTheme.colors.accentSurface,
  },
  patternText: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    color: appTheme.colors.textSecondary,
  },
  patternTextOn: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
  },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  sliderValue: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    color: appTheme.colors.textSecondary,
  },
  summaryCard: {
    marginTop: appTheme.space.md,
    padding: appTheme.space.lg,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surfaceRow,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    gap: 8,
  },
  summaryLine: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.body,
    lineHeight: appTheme.type.bodyLine,
    color: appTheme.colors.textSecondary,
  },
  summaryStrong: {
    fontFamily: appTheme.fonts.medium,
    color: appTheme.colors.text,
  },
  testBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.accentTint,
    borderWidth: 1,
    borderColor: appTheme.colors.accentBorderSoft,
  },
  testBtnText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.body,
    color: appTheme.colors.accent,
  },
});
