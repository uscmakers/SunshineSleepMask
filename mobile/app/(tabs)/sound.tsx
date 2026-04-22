import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LabeledSlider } from "@/components/sound/LabeledSlider";
import { AppScreen } from "@/components/ui/AppScreen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { appTheme } from "@/theme/appTheme";

const ROWS = [
  { id: "1", title: "Rain", sub: "Ambient" },
  { id: "2", title: "Ocean", sub: "Ambient" },
  { id: "3", title: "Forest", sub: "Ambient" },
];

export default function SoundScreen() {
  const [vol, setVol] = useState(0.45);
  const [timerMin, setTimerMin] = useState(30);
  const [active, setActive] = useState<string | null>(null);
  const [tab, setTab] = useState<"ambient" | "lib">("ambient");

  return (
    <AppScreen scroll contentContainerStyle={styles.top}>
      <ScreenHeader
        icon="music"
        title="Ambient sounds"
        subtitle="Relaxing audio for sleep"
      />

      <View style={styles.card}>
        <LabeledSlider
          label="Volume"
          value={vol}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onValueChange={setVol}
        />
        <LabeledSlider
          label="Sleep timer"
          value={timerMin}
          min={0}
          max={120}
          step={5}
          formatValue={(m) => (m === 0 ? "Off" : `${Math.round(m)} min`)}
          onValueChange={setTimerMin}
        />
      </View>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab("ambient")}
          style={[styles.tab, tab === "ambient" && styles.tabOn]}
        >
          <Text style={[styles.tabText, tab === "ambient" && styles.tabTextOn]}>
            Ambient
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("lib")}
          style={[styles.tab, tab === "lib" && styles.tabOn]}
        >
          <Text style={[styles.tabText, tab === "lib" && styles.tabTextOn]}>
            Library
          </Text>
        </Pressable>
      </View>

      {tab === "ambient"
        ? ROWS.map((r) => {
            const on = active === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setActive((c) => (c === r.id ? null : r.id))}
                style={[styles.row, on && styles.rowOn]}
              >
                <View>
                  <Text style={styles.rowTitle}>{r.title}</Text>
                  <Text style={styles.rowSub}>{r.sub}</Text>
                </View>
                <Text style={styles.rowHint}>Tap</Text>
              </Pressable>
            );
          })
        : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: appTheme.space.sm },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radii.lg,
    padding: appTheme.space.cardPadding,
    marginBottom: appTheme.space.lg,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: appTheme.colors.surfaceRow,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: 4,
    gap: 4,
    marginBottom: appTheme.space.lg,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: appTheme.radii.sm, alignItems: "center" },
  tabOn: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
  },
  tabText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.label,
    color: appTheme.colors.textMuted,
  },
  tabTextOn: { color: appTheme.colors.text },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    marginBottom: 10,
  },
  rowOn: { borderColor: appTheme.colors.accent },
  rowTitle: {
    fontFamily: appTheme.fonts.medium,
    fontSize: appTheme.type.rowTitle,
    color: appTheme.colors.text,
  },
  rowSub: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.label,
    color: appTheme.colors.textSecondary,
    marginTop: 4,
  },
  rowHint: {
    fontFamily: appTheme.fonts.regular,
    fontSize: appTheme.type.caption,
    color: appTheme.colors.textMuted,
  },
});
