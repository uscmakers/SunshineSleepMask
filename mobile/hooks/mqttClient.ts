// mqttClient.ts
import Constants from "expo-constants";
import mqtt, { MqttClient } from "mqtt";

const FLESPI_TOKEN = Constants.expoConfig?.extra?.flespiToken;
const DEVICE_ID = Constants.expoConfig?.extra?.deviceId || "sleepmask";
const COLOR_TOPIC = `devices/${DEVICE_ID}/color`;
const STATUS_TOPIC = `devices/${DEVICE_ID}/status`;
const HEARTBEAT_TOPIC = `devices/${DEVICE_ID}/heartbeat`;
const ALARM_TOPIC = `devices/${DEVICE_ID}/alarm/set`;

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

  client = mqtt.connect("wss://mqtt.flespi.io:443", {
    username: FLESPI_TOKEN,
    // password: FLESPI_TOKEN, // optional; you can leave it empty
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
      // parse and update UI if you want
      // e.g. { "color": "#FF8800" }
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

    // Normalize color (ensure it starts with '#')
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
