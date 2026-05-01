import FontAwesome from "@expo/vector-icons/FontAwesome";
import Constants from "expo-constants";
import React from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { appTheme } from "@/theme/appTheme";

/** Matches `a2dp_sink.start("Sunshine")` in `mask_microcontroller/combined.ino`. */
export const MASK_BLUETOOTH_NAME =
  (Constants.expoConfig?.extra?.bluetoothDeviceName as string | undefined) ?? "Sunshine";

/** JS-only deep links — no native rebuild. iOS prefs URLs are undocumented and may fail on some OS versions. */
async function openBluetoothSystemSettings(): Promise<void> {
  if (Platform.OS === "android") {
    const candidates = [
      "intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;package=com.android.settings;end",
      "intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;end",
      "intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;category=android.intent.category.DEFAULT;end",
    ];
    for (const uri of candidates) {
      try {
        await Linking.openURL(uri);
        return;
      } catch {
        /* try next */
      }
    }
    try {
      await Linking.openURL("android.settings.BLUETOOTH_SETTINGS");
      return;
    } catch {
      try {
        await Linking.openURL(
          "intent:#Intent;action=android.settings.SETTINGS;package=com.android.settings;end"
        );
      } catch {
        try {
          await Linking.openURL("intent:#Intent;action=android.settings.SETTINGS;end");
        } catch {
          await Linking.openSettings();
        }
      }
    }
    return;
  }

  if (Platform.OS === "ios") {
    // Never use Linking.openSettings() — it opens *this app's* sheet (often feels like "Apps").
    // Undocumented prefs URLs vary by iOS version; `App-Prefs:` often lands on the main Settings list first.
    const candidates = [
      "App-Prefs:",
      "App-Prefs:root=Bluetooth",
      "App-Prefs:Bluetooth",
      "prefs:root=Bluetooth",
      "App-Prefs:root=General&path=Bluetooth",
      "App-Prefs:root=General",
      "prefs:root=General",
    ];
    for (const uri of candidates) {
      try {
        await Linking.openURL(uri);
        return;
      } catch {
        /* try next */
      }
    }
    return;
  }

  await Linking.openSettings();
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectMaskModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  if (Platform.OS === "web") return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { marginBottom: Math.max(insets.bottom, appTheme.space.lg) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconWrap}>
            <FontAwesome name="bluetooth-b" size={28} color={appTheme.colors.accent} />
          </View>
          <Text style={styles.title}>Connect to {MASK_BLUETOOTH_NAME}</Text>
          <Text style={styles.body}>
            Open Bluetooth in Settings and pair with{" "}
            <Text style={styles.em}>&quot;{MASK_BLUETOOTH_NAME}&quot;</Text>.
          </Text>
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => void openBluetoothSystemSettings()}
          >
            <Text style={styles.btnPrimaryText}>Bluetooth settings</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
            <Text style={styles.btnSecondaryText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: appTheme.colors.overlay,
    justifyContent: "center",
    paddingHorizontal: appTheme.space.screenPadding,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radii.xl,
    borderWidth: 1,
    borderColor: appTheme.colors.borderInner,
    padding: appTheme.space.cardPadding,
  },
  iconWrap: {
    alignSelf: "center",
    marginBottom: appTheme.space.md,
  },
  title: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 20,
    color: appTheme.colors.text,
    textAlign: "center",
    marginBottom: appTheme.space.md,
  },
  body: {
    fontFamily: appTheme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: appTheme.colors.textSecondary,
    textAlign: "center",
    marginBottom: appTheme.space.lg,
  },
  em: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.medium,
  },
  btn: {
    paddingVertical: appTheme.space.md,
    borderRadius: appTheme.radii.md,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: appTheme.colors.accent,
    marginBottom: appTheme.space.sm,
  },
  btnPrimaryText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
    color: "#000000",
  },
  btnSecondary: {
    backgroundColor: "transparent",
  },
  btnSecondaryText: {
    fontFamily: appTheme.fonts.medium,
    fontSize: 16,
    color: appTheme.colors.accentMuted,
  },
});
