// mqttClient.ts
//
// Parity with `mask_microcontroller/secrets.h` (ESP32), matching lines 5–12 there:
// ---------------------------------------------------------------------------
// WIFI_SSID / WIFI_PASSWORD     → ESP32 Wi‑Fi only (not used in React Native).
// MQTT_HOST     "mqtt.flespi.io"
// MQTT_PORT     1883            → TCP on device (PubSubClient). This app uses WSS on 443 below.
// MQTT_TOKEN    "<flespi>"    → Same value as `expo.extra.flespiToken` (username; password empty).
// MQTT_CLIENT_ID "esp32-client" → ESP MQTT client id; reflected in `expo.extra.deviceId`. Topic paths
//                                 stay `devices/sleepmask/...`, not `devices/${clientId}/...`.
// ledSwapRedGreen (expo.extra)   → When true, `sendColor` / `sendSequence` swap R and G in hex before MQTT.
// phoneSunriseDemo (expo.extra) → When true, `startPhoneSunriseSimulation` drives sunrise via `color` MQTT (works without reflashing ESP).
// ---------------------------------------------------------------------------

import Constants from "expo-constants";
import mqtt, { MqttClient } from "mqtt";

const FLESPI_TOKEN = Constants.expoConfig?.extra?.flespiToken;
/** When true, R and G byte pairs in "#RRGGBB" are swapped before publish (compensate on app side; keep firmware standard). */
const LED_SWAP_RG = Constants.expoConfig?.extra?.ledSwapRedGreen === true;

/** Same host as `MQTT_HOST` in secrets.h */
const MQTT_HOST = "mqtt.flespi.io";
/** React Native / browser MQTT.js uses WSS; ESP uses TCP `MQTT_PORT` (1883) in secrets.h */
const MQTT_WSS_URL = `wss://${MQTT_HOST}:443`;

/**
 * Fixed topic namespace — must match firmware (`devices/sleepmask/color`, `alarm/set`, etc.).
 * Do not use `expo.extra.deviceId` as a path segment (that value is the ESP MQTT client id only).
 */
const MQTT_TOPIC_PREFIX = "devices/sleepmask";

const COLOR_TOPIC = `${MQTT_TOPIC_PREFIX}/color`;
const STATUS_TOPIC = `${MQTT_TOPIC_PREFIX}/status`;
const HEARTBEAT_TOPIC = `${MQTT_TOPIC_PREFIX}/heartbeat`;
const ALARM_TOPIC = `${MQTT_TOPIC_PREFIX}/alarm/set`;
const SEQUENCE_TOPIC = `${MQTT_TOPIC_PREFIX}/sequence`;

let client: MqttClient | null = null;
let isConnected = false;
let lastHeartbeatAt: number | null = null;
const connectionListeners = new Set<(s: { connected: boolean; lastHeartbeatAt: number | null }) => void>();

function emitConnection() {
  const payload = { connected: isConnected, lastHeartbeatAt };
  connectionListeners.forEach((fn) => fn(payload));
}

/** Logical UI color → hex sent over MQTT. Swaps only R and G nibbles when `ledSwapRedGreen` extra is true. */
export function mqttHexFromUiColor(hexIn: string): string {
  let hex = hexIn.trim();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  const body = hex.slice(1);
  if (body.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(body)) return hex;
  if (!LED_SWAP_RG) return hex;
  const r = body.slice(0, 2);
  const g = body.slice(2, 4);
  const b = body.slice(4, 6);
  return `#${g}${r}${b}`;
}

export function initMqtt() {
  if (client) return;

  client = mqtt.connect(MQTT_WSS_URL, {
    username: FLESPI_TOKEN,
    keepalive: 30,
    reconnectPeriod: 2000,
    clean: true,
  });

  client.on("connect", () => {
    console.log("MQTT connected");
    isConnected = true;
    emitConnection();
    client!.subscribe(STATUS_TOPIC, (err) => {
      if (err) console.error("Subscribe error", err);
    });
    client!.subscribe(HEARTBEAT_TOPIC, (err) => {
      if (err) console.error("Heartbeat subscribe error", err);
    });
  });

  client.on("message", (topic, payload) => {
    if (topic === HEARTBEAT_TOPIC) {
      lastHeartbeatAt = Date.now();
      isConnected = true;
      emitConnection();
    }
    if (topic === STATUS_TOPIC) {
      const msg = payload.toString();
      console.log("Status from ESP32:", msg);
    }
  });

  client.on("error", (err) => {
    console.error("MQTT error", err);
    isConnected = false;
    emitConnection();
  });

  client.on("close", () => {
    console.log("MQTT connection closed");
    isConnected = false;
    emitConnection();
  });
}

export function subscribeMqttConnection(
  fn: (s: { connected: boolean; lastHeartbeatAt: number | null }) => void
) {
  connectionListeners.add(fn);
  fn({ connected: isConnected, lastHeartbeatAt });
  return () => {
    connectionListeners.delete(fn);
  };
}

// export function sendColor(colorHex: string) {
//   try {
//     if (!client) {
//       console.warn("MQTT client not initialized");
//       return;
//     }

//     if (!client.connected) {
//       console.warn("MQTT not connected yet");
//       return;
//     }

//     if (!colorHex.startsWith("#")) colorHex = "#" + colorHex;

//     const payload = JSON.stringify({ color: colorHex });
//     client.publish(COLOR_TOPIC, payload, { qos: 0 }, (err) => {
//       if (err) console.error("Publish error", err);
//       console.log("Color sent:", colorHex);
//     });
//   } catch (error) {
//     console.error("Error sending color:", error);
//   }
// }
// Add this alongside sendColor and sendAlarmSettings

export interface SequenceOptions {
  colors: string[];      // array of "#RRGGBB" strings
  holdMs?: number;       // ms per step, default 1000
  fade?: boolean;        // crossfade between steps, default true
}

export function sendSequence(opts: SequenceOptions) {
  try {
    if (!client || !client.connected) {
      console.warn("MQTT not connected");
      return false;
    }
    const payload = JSON.stringify({
      colors: opts.colors.map((c) => mqttHexFromUiColor(c)),
      holdMs: opts.holdMs ?? 1000,
      fade:   opts.fade   ?? true,
    });
    client.publish(SEQUENCE_TOPIC, payload, { qos: 0 });
    return true;
  } catch (e) {
    console.error("sendSequence error:", e);
    return false;
  }
}

// Also update sendColor to support mode:
export function sendColor(colorHex: string, mode: "solid"|"pulse"|"rainbow" = "solid") {
  if (!client?.connected) { console.warn("MQTT not connected"); return; }
  const hex = mqttHexFromUiColor(colorHex.startsWith("#") ? colorHex : `#${colorHex}`);
  const payload = JSON.stringify({ color: hex, mode });
  client.publish(COLOR_TOPIC, payload, { qos: 0 });
}

/** Same HSV→RGB as `combined.ino` MODE_SUNRISE (`hsvToRgb`): h °, s,v ∈ [0,1]. */
function hsvToRgbFirmware(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rr = 0;
  let gg = 0;
  let bb = 0;
  if (h < 60) {
    rr = c;
    gg = x;
  } else if (h < 120) {
    rr = x;
    gg = c;
  } else if (h < 180) {
    gg = c;
    bb = x;
  } else if (h < 240) {
    gg = x;
    bb = c;
  } else if (h < 300) {
    rr = x;
    bb = c;
  } else {
    rr = c;
    bb = x;
  }
  const ch = (channel: number) => Math.min(255, Math.max(0, Math.round((channel + m) * 255)));
  return [ch(rr), ch(gg), ch(bb)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const x = (n: number) => n.toString(16).padStart(2, "0");
  return `#${x(r)}${x(g)}${x(b)}`;
}

let phoneSunriseInterval: ReturnType<typeof setInterval> | null = null;

/** Stop an in-progress phone-driven sunrise (see `startPhoneSunriseSimulation`). */
export function stopPhoneSunriseSimulation(): void {
  if (phoneSunriseInterval !== null) {
    clearInterval(phoneSunriseInterval);
    phoneSunriseInterval = null;
  }
}

/**
 * Runs the same sunrise curve as `combined.ino` but sends many `color` updates over MQTT.
 * Works on ESP firmware that already handles `devices/sleepmask/color` — no `alarm/set` or flash update needed.
 * Call `stopPhoneSunriseSimulation` when leaving the screen or starting another run.
 */
export function startPhoneSunriseSimulation(durationMinutes: number, brightness: number): boolean {
  if (!client?.connected) return false;
  stopPhoneSunriseSimulation();

  const dm = Number(durationMinutes);
  const durMin = Math.max(0.5, Math.min(45, Number.isFinite(dm) ? dm : 15));
  const durationMs = durMin * 60 * 1000;
  const br = Number(brightness);
  const maxBright = Math.max(0, Math.min(1, Number.isFinite(br) ? br : 0.8));
  const tickMs = 100;
  const start = Date.now();

  const tick = () => {
    const elapsed = Date.now() - start;
    const t = Math.min(1, elapsed / durationMs);
    const hue = t * 60;
    const sat = 1 - t * 0.9;
    const [r0, g0, b0] = hsvToRgbFirmware(hue, sat, 1);
    const bVal = 1 + t * (maxBright * 254);
    const scale = bVal / 255;
    const r = Math.min(255, Math.max(0, Math.round(r0 * scale)));
    const g = Math.min(255, Math.max(0, Math.round(g0 * scale)));
    const b = Math.min(255, Math.max(0, Math.round(b0 * scale)));
    sendColor(rgbToHex(r, g, b));

    if (t >= 1) stopPhoneSunriseSimulation();
  };

  tick();
  phoneSunriseInterval = setInterval(tick, tickMs);
  return true;
}

export function sendAlarmSettings(sunriseDuration: number, brightness: number) {
  try {
    if (!client || !client.connected) {
      console.warn("MQTT not connected yet");
      return false;
    }
    const durationMin = Math.max(0.5, Math.min(45, sunriseDuration));
    const payload = JSON.stringify({
      sunriseDuration: durationMin,
      brightness: Math.max(0, Math.min(1, brightness)),
    });
    client.publish(ALARM_TOPIC, payload, { qos: 0 }, (err) => {
      if (err) console.error("Alarm publish error", err);
    });
    return true;
  } catch (error) {
    console.error("Error sending alarm settings:", error);
    return false;
  }
}
