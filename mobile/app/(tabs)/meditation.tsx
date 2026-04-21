import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet, Text,
  TouchableOpacity,
  View,
} from "react-native";

type AudioItem = {
  id: string;
  title: string;
  file: any;
};

const AUDIO_DATA: AudioItem[] = [
  {
    id: "1",
    title: "Brown Noise",
    file: require("../assets/audio/brown-noise.mp3"),
  },
  
];

export default function MeditationScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      // cleanup when leaving screen
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSound = async (item: AudioItem) => {
  try {
    // Toggle same audio
    if (currentId === item.id && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    // Stop previous
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(item.file, {
      isLooping: true, // ✅ LOOP ENABLED
    });

    soundRef.current = sound;

    await sound.playAsync();
    setCurrentId(item.id);
    setIsPlaying(true);
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};

  const renderItem = ({ item }: { item: AudioItem }) => {
    const isActive = currentId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.activeCard]}
        onPress={() => playSound(item)}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.status}>
          {isActive ? (isPlaying ? "Playing" : "Paused") : "Tap to play"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meditation Before Bed 🌙</Text>

      <Text style={styles.text}>
        What are you most grateful for today?
      </Text>

      <Text style={styles.text}>
        Take 3 breaths for that… inhale… exhale…
      </Text>

      <Text style={styles.text}>
        What are you excited for tomorrow?
      </Text>

      <Text style={styles.footer}>
        Stay present. That’s enough.
      </Text>
      <Text style={styles.header}>Ambient Sounds</Text>

      <FlatList
        data={AUDIO_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f1a",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1a2238",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  activeCard: {
    backgroundColor: "#2e3b6b",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  status: {
    color: "#aab",
    marginTop: 6,
  },
  text: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  footer: {
    color: 'gray',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});