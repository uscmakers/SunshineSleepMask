import React from "react";
import { StyleSheet, View } from "react-native";

import { OptionChipRow } from "@/components/ui/OptionChipRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { appTheme } from "@/theme/appTheme";

const RAMP_OPTIONS = [5, 10, 15, 20, 30] as const;
const SNOOZE_OPTIONS = [5, 9, 10, 15] as const;

type SunriseSnoozePanelsProps = {
  sunriseRampMinutes: number;
  setSunriseRampMinutes: (m: number) => void;
  snoozeMinutes: number;
  setSnoozeMinutes: (m: number) => void;
};

export function SunriseSnoozePanels({
  sunriseRampMinutes,
  setSunriseRampMinutes,
  snoozeMinutes,
  setSnoozeMinutes,
}: SunriseSnoozePanelsProps) {
  return (
    <View>
      <View style={styles.section}>
        <SectionHeader title="Sunrise length" />
        <OptionChipRow
          options={[...RAMP_OPTIONS]}
          selected={
            (RAMP_OPTIONS as readonly number[]).includes(sunriseRampMinutes)
              ? sunriseRampMinutes
              : RAMP_OPTIONS[1]
          }
          onSelect={(m) => setSunriseRampMinutes(m)}
          formatLabel={(m) => `${m} min`}
        />
      </View>
      <View style={styles.section}>
        <SectionHeader title="Snooze" />
        <OptionChipRow
          options={[...SNOOZE_OPTIONS]}
          selected={
            (SNOOZE_OPTIONS as readonly number[]).includes(snoozeMinutes)
              ? snoozeMinutes
              : SNOOZE_OPTIONS[1]
          }
          onSelect={(m) => setSnoozeMinutes(m)}
          formatLabel={(m) => `${m} min`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: appTheme.space.lg,
  },
});
