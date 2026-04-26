import type { LocalPlayParams } from "@/audio/types";

type Row = LocalPlayParams & { sub: string };

export const AMBIENT_TRACKS: Row[] = [
  {
    id: "a-waterfall",
    title: "Waterfall",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/Waterfall.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-rhythmic-rainfall",
    title: "Rhythmic Rainfall",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/RhythmicRainfall.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-rain-thunder",
    title: "Rain & Thunder",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/RainAndThunder.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-ocean",
    title: "Ocean",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/Ocean.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-brown",
    title: "Brown Noise",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/BrownNoise.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-white",
    title: "White Noise",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/WhiteNoise.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-pink",
    title: "Pink Noise",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/PinkNoise.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-birds",
    title: "Bird Noises",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/BirdNoises.mp3"),
    loop: true,
    source: "ambient",
  },
  {
    id: "a-black-white-static",
    title: "Black & White Static",
    sub: "Ambient",
    file: require("../../assets/audio/ambient-sounds/BlackAndWhiteStatic.mp3"),
    loop: true,
    source: "ambient",
  },
];

export const MEDITATION_TRACKS: Row[] = [
  {
    id: "m-body-scan",
    title: "Body Scan",
    sub: "Meditation",
    file: require("../../assets/audio/Meditation/BodyScan.mp3"),
    loop: false,
    source: "meditation",
  },
  {
    id: "m-short-relaxation",
    title: "Short Relaxation",
    sub: "Meditation",
    file: require("../../assets/audio/Meditation/ShortRelaxation.mp3"),
    loop: false,
    source: "meditation",
  },
];
