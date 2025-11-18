// mqttClient.ts
import Constants from "expo-constants";
import mqtt, { MqttClient } from "mqtt";

const FLESPI_TOKEN = Constants.expoConfig?.extra?.flespiToken;
const DEVICE_ID = Constants.expoConfig?.extra?.deviceId || "sleepmask";
const COLOR_TOPIC = `devices/${DEVICE_ID}/color`;
const STATUS_TOPIC = `devices/${DEVICE_ID}/status`;

let client: MqttClient | null = null;

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
    client!.subscribe(STATUS_TOPIC, (err) => {
      if (err) console.error("Subscribe error", err);
    });
  });

  client.on("message", (topic, payload) => {
    if (topic === STATUS_TOPIC) {
      const msg = payload.toString();
      console.log("Status from ESP32:", msg);
      // parse and update UI if you want
      // e.g. { "color": "#FF8800" }
    }
  });

  client.on("error", (err) => {
    console.error("MQTT error", err);
  });

  client.on("close", () => {
    console.log("MQTT connection closed");
  });
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
    });
  } catch (error) {
    console.error("Error sending color:", error);
  }
}
