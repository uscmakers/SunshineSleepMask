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
// ---------------------------------------------------------------------------

import Constants from "expo-constants";
import mqtt, { MqttClient } from "mqtt";

const FLESPI_TOKEN = Constants.expoConfig?.extra?.flespiToken;

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

let client: MqttClient | null = null;
let isConnected = false;
let lastHeartbeatAt: number | null = null;
const connectionListeners = new Set<(s: { connected: boolean; lastHeartbeatAt: number | null }) => void>();

function emitConnection() {
  const payload = { connected: isConnected, lastHeartbeatAt };
  connectionListeners.forEach((fn) => fn(payload));
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

export function sendColor(colorHex: string) {
  try {
    if (!client) {
      console.warn("MQTT client not initialized");
      return;
    }

    if (!client.connected) {
      console.warn("MQTT not connected yet");
      return;
    }

    if (!colorHex.startsWith("#")) colorHex = "#" + colorHex;

    const payload = JSON.stringify({ color: colorHex });
    client.publish(COLOR_TOPIC, payload, { qos: 0 }, (err) => {
      if (err) console.error("Publish error", err);
      console.log("Color sent:", colorHex);
    });
  } catch (error) {
    console.error("Error sending color:", error);
  }
}

export function sendAlarmSettings(sunriseDuration: number, brightness: number) {
  try {
    if (!client || !client.connected) {
      console.warn("MQTT not connected yet");
      return false;
    }
    const payload = JSON.stringify({
      sunriseDuration: Math.max(5, Math.min(45, Math.round(sunriseDuration))),
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
