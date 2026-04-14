import Constants from "expo-constants";
import { Link } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMaskMqtt } from "@/providers/MaskMqttContext";
import { useWakePreferences } from "@/providers/WakePreferencesContext";

export default function HomeScreen() {
  const { brokerConnected, maskReachable, telemetry } = useMaskMqtt();
  const {
    wakeColorHex,
    sunriseRampMinutes,
    snoozeMinutes,
  } = useWakePreferences();

  const tokenConfigured = Boolean(Constants.expoConfig?.extra?.flespiToken);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sunshine Mask</Text>
      <Text style={styles.subtitle}>Status</Text>

      {!tokenConfigured ? (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            Set FLESPI_TOKEN in mobile/.env for MQTT (see app.config.js).
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>MQTT broker</Text>
        <Text style={styles.cardValue}>
          {brokerConnected ? "Connected" : "Disconnected"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Mask (last heartbeat)</Text>
        <Text style={styles.cardValue}>
          {maskReachable ? "Reachable" : "No recent heartbeat"}
        </Text>
        {telemetry?.lastHeartbeatAt ? (
          <Text style={styles.cardHint}>
            Updated{" "}
            {new Date(telemetry.lastHeartbeatAt).toLocaleTimeString()}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Battery</Text>
        <Text style={styles.cardValue}>
          {telemetry?.batteryPercent != null
            ? `${telemetry.batteryPercent}%`
            : "—"}
        </Text>
        {telemetry?.batteryMv != null ? (
          <Text style={styles.cardHint}>{telemetry.batteryMv} mV</Text>
        ) : null}
      </View>

      {telemetry?.wifiRssiDbm != null ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Wi‑Fi RSSI</Text>
          <Text style={styles.cardValue}>{telemetry.wifiRssiDbm} dBm</Text>
        </View>
      ) : null}

      {telemetry?.firmwareVersion ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Firmware</Text>
          <Text style={styles.cardValue}>{telemetry.firmwareVersion}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>App wake settings</Text>
      <Text style={styles.sectionHint}>
        These mirror what you set on the Alarm tab until ESP32 alarm sync is
        wired up.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Wake color</Text>
        <View style={styles.colorRow}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: wakeColorHex },
            ]}
          />
          <Text style={styles.cardValue}>{wakeColorHex}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Sunrise ramp</Text>
        <Text style={styles.cardValue}>{sunriseRampMinutes} min</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Snooze</Text>
        <Text style={styles.cardValue}>{snoozeMinutes} min</Text>
      </View>

      <Link href="/modal" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>About / info</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  sectionHint: {
    fontSize: 13,
    color: "#777",
    marginTop: 6,
    marginBottom: 12,
  },
  warn: {
    backgroundColor: "#3a2a10",
    borderColor: "#8a6a20",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  warnText: {
    color: "#f5d78e",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#111",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  cardHint: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    color: "#2dd4bf",
    fontSize: 15,
  },
});
