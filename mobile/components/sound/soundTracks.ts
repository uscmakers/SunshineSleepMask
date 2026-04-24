import type { LocalPlayParams } from "@/audio/types";

type Row = LocalPlayParams & { sub: string };

export const AMBIENT_TRACKS: Row[] = [
  {
    id: "a-rain",
    title: "Rain",
    sub: "Ambient",
    file: require("../../assets/audio/rain-sounds.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-brown",
    title: "Brown noise",
    sub: "Ambient",
    file: require("../../assets/audio/brown-noise.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-wf",
    title: "Waterfall",
    sub: "Ambient",
    file: require("../../assets/audio/Waterfall.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-rr",
    title: "Rhythmic Rainfall",
    sub: "Ambient",
    file: require("../../assets/audio/RhythmicRainfall.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-bw",
    title: "Black & White Static",
    sub: "Ambient",
    file: require("../../assets/audio/BlackAndWhiteStatic.mp3"),
    loop: true,
    source: "ambient",
  },
];

export const MEDITATION_TRACKS: Row[] = [
  {
    id: "m-rain",
    title: "Rain focus",
    sub: "Meditation",
    file: require("../../assets/audio/rain-sounds.mp3"),
    loop: false,
    source: "meditation",
  },
  {
    id: "m-brown",
    title: "Body scan — brown noise",
    sub: "Meditation",
    file: require("../../assets/audio/brown-noise.mp3"),
    loop: false,
    source: "meditation",
  },
  {
    id: "m-bw",
    title: "Stillness (static bed)",
    sub: "Meditation",
    file: require("../../assets/audio/BlackAndWhiteStatic.mp3"),
    loop: false,
    source: "meditation",
  },
];
