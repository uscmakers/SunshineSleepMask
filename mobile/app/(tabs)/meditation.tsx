import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AudioItem = {
  id: string;
  title: string;
  file: number | { uri: string };
  isUserUpload?: boolean;
};

const BUILT_IN_AUDIO: AudioItem[] = [
  {
    id: "1",
    title: "Rain Sounds",
    file: require("../../assets/audio/rain-sounds.mp3"),
  },
];

export default function AudioScrollScreen() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<AudioItem[]>(BUILT_IN_AUDIO);

  useEffect(() => {
    return () => {
      playerRef.current?.pause();
      playerRef.current = null;
    };
  }, []);

  const stopCurrentPlayer = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current = null;
    }
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "video/mp4", "audio/mp4"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      const newItem: AudioItem = {
        id: `upload-${Date.now()}`,
        title: asset.name ?? "Uploaded Audio",
        file: { uri: asset.uri },
        isUserUpload: true,
      };

      setAudioData((prev) => [...prev, newItem]);
    } catch (error) {
      console.error("Error picking audio file:", error);
    }
  };

  const playSound = (item: AudioItem) => {
    try {
      if (currentId === item.id && playerRef.current) {
        if (isPlaying) {
          playerRef.current.pause();
          setIsPlaying(false);
        } else {
          playerRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      stopCurrentPlayer();

      const player = createAudioPlayer(item.file);
      player.loop = true;
      player.play();

      playerRef.current = player;
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
        {item.isUserUpload && <Text style={styles.badge}>Uploaded</Text>}
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

      <TouchableOpacity style={styles.uploadButton} onPress={pickAudioFile}>
        <Text style={styles.uploadButtonText}>Upload your own audio</Text>
      </TouchableOpacity>

      <FlatList
        data={audioData}
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
    color: "white",
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  footer: {
    color: "gray",
    fontSize: 14,
    marginTop: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: "#324376",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    color: "#c7d2fe",
    marginTop: 8,
    fontSize: 12,
  },
});