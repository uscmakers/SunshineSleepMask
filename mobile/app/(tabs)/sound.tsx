import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { sendAudioCommand } from "@/hooks/mqttClient";

const PLACEHOLDER_TRACKS = [
  { id: "1", title: "Rain", subtitle: "Ambient" },
  { id: "2", title: "Ocean", subtitle: "Ambient" },
  { id: "3", title: "Forest night", subtitle: "Ambient" },
  { id: "4", title: "Body scan (short)", subtitle: "Guided" },
];

export default function SoundScreen() {
  const [volume, setVolume] = useState(0.45);
  const [sleepTimerMin, setSleepTimerMin] = useState(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sound</Text>
      <Text style={styles.subtitle}>
        Volume and sleep timer will drive ESP32 + MAX98357 over MQTT (v1 audio
        commands) once firmware implements playback.
      </Text>

      <Text style={styles.label}>Volume</Text>
      <View style={styles.sliderRow}>
        <Pressable
          style={styles.sliderBtn}
          onPress={() => setVolume((v) => Math.max(0, v - 0.05))}
        >
          <Text style={styles.sliderBtnText}>−</Text>
        </Pressable>
        <Text style={styles.sliderValue}>{Math.round(volume * 100)}%</Text>
        <Pressable
          style={styles.sliderBtn}
          onPress={() => setVolume((v) => Math.min(1, v + 0.05))}
        >
          <Text style={styles.sliderBtnText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Sleep timer (minutes)</Text>
      <View style={styles.sliderRow}>
        <Pressable
          style={styles.sliderBtn}
          onPress={() => setSleepTimerMin((m) => Math.max(0, m - 5))}
        >
          <Text style={styles.sliderBtnText}>−</Text>
        </Pressable>
        <Text style={styles.sliderValue}>
          {sleepTimerMin === 0 ? "Off" : `${sleepTimerMin} min`}
        </Text>
        <Pressable
          style={styles.sliderBtn}
          onPress={() => setSleepTimerMin((m) => Math.min(180, m + 5))}
        >
          <Text style={styles.sliderBtnText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Library (placeholder)</Text>
      <FlatList
        data={PLACEHOLDER_TRACKS}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const active = item.id === selectedId;
          return (
            <Pressable
              style={[styles.trackRow, active && styles.trackRowActive]}
              onPress={() => {
                setSelectedId(item.id);
                sendAudioCommand("audio.load", {
                  trackId: `placeholder-${item.id}`,
                  url: "https://example.com/placeholder.mp3",
                  codecHint: "mp3_cbr_128_mono",
                });
              }}
            >
              <Text style={styles.trackTitle}>{item.title}</Text>
              <Text style={styles.trackSub}>{item.subtitle}</Text>
            </Pressable>
          );
        }}
      />
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
  },
  subtitle: {
    color: "#777",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  sliderBtn: {
    backgroundColor: "#222",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  sliderBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
  },
  sliderValue: {
    color: "#fff",
    fontSize: 18,
    minWidth: 100,
    textAlign: "center",
  },
  section: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  trackRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 10,
  },
  trackRowActive: {
    borderColor: "#2dd4bf",
  },
  trackTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  trackSub: {
    color: "#888",
    fontSize: 13,
    marginTop: 4,
  },
});
