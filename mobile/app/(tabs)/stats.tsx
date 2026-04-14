import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep stats</Text>
      <Text style={styles.body}>
        This tab will read sleep duration, bedtime, and wake time from
        HealthKit (and optionally sleep stages). That requires an Expo
        development build with native entitlements, not Expo Go.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next implementation steps</Text>
        <Text style={styles.cardLine}>• Run `npx expo prebuild` when ready</Text>
        <Text style={styles.cardLine}>• Add HealthKit capability + usage strings</Text>
        <Text style={styles.cardLine}>• Use a small native module or maintained HealthKit bridge</Text>
        <Text style={styles.cardLine}>• Query last night’s sleep samples and render charts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  body: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 16,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  cardLine: {
    color: "#888",
    fontSize: 14,
    marginBottom: 6,
  },
});
