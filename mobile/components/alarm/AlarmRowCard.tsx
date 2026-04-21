import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

export type AlarmListItem = {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
};

type AlarmRowCardProps = {
  alarm: AlarmListItem;
  onToggle: () => void;
  onRemove: () => void;
  onEdit: () => void;
};

export function AlarmRowCard({
  alarm,
  onToggle,
  onRemove,
  onEdit,
}: AlarmRowCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.time}>{alarm.time}</Text>
        <Text style={styles.label}>{alarm.label}</Text>
      </View>
      <View style={styles.right}>
        <Switch value={alarm.enabled} onValueChange={onToggle} />
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} hitSlop={8}>
            <Text style={styles.action}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Text style={styles.delete}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: appTheme.type.labelLine,
  },
  right: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    color: appTheme.colors.accent,
    fontSize: 16,
  },
  delete: {
    color: appTheme.colors.textSecondary,
    fontSize: 18,
  },
});
