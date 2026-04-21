import Constants from "expo-constants";
import mqtt, { MqttClient } from "mqtt";

const FLESPI_TOKEN = Constants.expoConfig?.extra?.flespiToken;
const DEVICE_ID = Constants.expoConfig?.extra?.deviceId || "sleepmask";

const BASE = `devices/${DEVICE_ID}`;
/** v1 protocol (docs/mqtt-protocol-v1.md) */
export const MQTT_TOPICS = {
  downlinkColor: `${BASE}/downlink/color`,
  downlinkAudio: `${BASE}/downlink/audio`,
  uplinkHeartbeat: `${BASE}/uplink/heartbeat`,
  uplinkWildcard: `${BASE}/uplink/#`,
  /** Pre–v1 firmware */
  legacyColor: `${BASE}/color`,
  legacyStatus: `${BASE}/status`,
} as const;

export type MaskTelemetry = {
  lastHeartbeatAt: number;
  batteryPercent: number | null;
  batteryMv: number | null;
  wifiRssiDbm: number | null;
  firmwareVersion: string | null;
};

export type MaskAudioPlayback = {
  state: string;
  trackId: string | null;
  lastEventAt: number;
};

let client: MqttClient | null = null;
const telemetryListeners = new Set<(t: MaskTelemetry) => void>();
const brokerListeners = new Set<(connected: boolean) => void>();
const audioListeners = new Set<(a: MaskAudioPlayback) => void>();

function emitTelemetry(t: MaskTelemetry) {
  telemetryListeners.forEach((fn) => fn(t));
}

function emitBroker(connected: boolean) {
  brokerListeners.forEach((fn) => fn(connected));
}

export function subscribeMaskTelemetry(fn: (t: MaskTelemetry) => void) {
  telemetryListeners.add(fn);
  return () => telemetryListeners.delete(fn);
}

export function subscribeMqttBrokerState(fn: (connected: boolean) => void) {
  brokerListeners.add(fn);
  return () => brokerListeners.delete(fn);
}

export function subscribeMaskAudioState(fn: (a: MaskAudioPlayback) => void) {
  audioListeners.add(fn);
  return () => audioListeners.delete(fn);
}

function emitAudio(a: MaskAudioPlayback) {
  audioListeners.forEach((fn) => fn(a));
}

function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseHeartbeatPayload(raw: string): MaskTelemetry | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const inner =
      obj &&
      typeof obj === "object" &&
      "payload" in obj &&
      obj.payload &&
      typeof obj.payload === "object"
        ? (obj.payload as Record<string, unknown>)
        : obj;

    const batteryPercent =
      typeof inner.batteryPercent === "number" &&
      Number.isFinite(inner.batteryPercent)
        ? inner.batteryPercent
        : null;

    const batteryMv =
      typeof inner.batteryMv === "number" && Number.isFinite(inner.batteryMv)
        ? inner.batteryMv
        : null;
    const wifiRssiDbm =
      typeof inner.wifiRssiDbm === "number" && Number.isFinite(inner.wifiRssiDbm)
        ? inner.wifiRssiDbm
        : typeof inner.wifiRssi === "number" && Number.isFinite(inner.wifiRssi)
          ? inner.wifiRssi
          : null;
    const firmwareVersion =
      typeof inner.firmwareVersion === "string" ? inner.firmwareVersion : null;

    return {
      lastHeartbeatAt: Date.now(),
      batteryPercent,
      batteryMv,
      wifiRssiDbm,
      firmwareVersion,
    };
  } catch {
    return null;
  }
}

function parseAudioStatePayload(raw: string): MaskAudioPlayback | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (obj.type !== "audio.state") {
      return null;
    }
    const payload =
      obj.payload && typeof obj.payload === "object"
        ? (obj.payload as Record<string, unknown>)
        : null;
    if (!payload) return null;
    return {
      state: typeof payload.state === "string" ? payload.state : "unknown",
      trackId: typeof payload.trackId === "string" ? payload.trackId : null,
      lastEventAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function handleUplinkMessage(topic: string, payload: Buffer) {
  const raw = payload.toString();
  const isHeartbeat =
    topic === MQTT_TOPICS.uplinkHeartbeat ||
    topic.endsWith("/uplink/heartbeat");
  const isLegacyStatus = topic === MQTT_TOPICS.legacyStatus;
  /** Suffix must include `/` so paths like `foo/uplink/audio` do not match. */
  const isAudioState = topic.endsWith("/uplink/audio");

  if (isAudioState) {
    const audio = parseAudioStatePayload(raw);
    if (audio) {
      emitAudio(audio);
    }
    return;
  }

  if (!isHeartbeat && !isLegacyStatus) {
    return;
  }

  const parsed = parseHeartbeatPayload(raw);
  if (!parsed) {
    return;
  }
  emitTelemetry(parsed);
}

/**
 * Forces a broker reconnect if a client already exists; otherwise initializes MQTT.
 * Does not change topic payloads or subscription semantics.
 */
export function reconnectMqtt(): boolean {
  try {
    if (client) {
      client.reconnect();
      return true;
    }
    initMqtt();
    return true;
  } catch (e) {
    console.error("reconnectMqtt error", e);
    return false;
  }
}

export function initMqtt() {
  if (client) {
    return;
  }

  client = mqtt.connect("wss://mqtt.flespi.io:443", {
    username: FLESPI_TOKEN,
    keepalive: 30,
    reconnectPeriod: 2000,
    clean: true,
  });

  client.on("connect", () => {
    console.log("MQTT connected");
    emitBroker(true);
    client!.subscribe(
      [MQTT_TOPICS.uplinkWildcard, MQTT_TOPICS.legacyStatus],
      (err) => {
        if (err) {
          console.error("MQTT subscribe error", err);
        }
      }
    );
  });

  client.on("message", (topic, payload) => {
    handleUplinkMessage(topic, payload);
  });

  client.on("error", (err) => {
    console.error("MQTT error", err);
    // Not every failure emits `close` immediately; keep UI in sync with broker state.
    emitBroker(false);
  });

  client.on("close", () => {
    console.log("MQTT connection closed");
    emitBroker(false);
  });
}

export function mqttBrokerConnected(): boolean {
  return client?.connected ?? false;
}

/**
 * Publishes wake / preview color: v1 JSON on downlink, plus legacy JSON for older firmware.
 */
export function sendAudioCommand(
  type: string,
  payload: Record<string, unknown>
) {
  try {
    if (!client?.connected) {
      console.warn("MQTT not connected; audio command not sent");
      return;
    }
    const body = JSON.stringify({
      schemaVersion: 1,
      messageId: newMessageId(),
      sentAt: new Date().toISOString(),
      type,
      payload,
    });
    client.publish(MQTT_TOPICS.downlinkAudio, body, { qos: 0 }, (err) => {
      if (err) {
        console.error("Publish audio command error", err);
      }
    });
  } catch (e) {
    console.error("sendAudioCommand error", e);
  }
}

export function sendColor(colorHex: string, brightness = 1) {
  try {
    if (!client?.connected) {
      console.warn("MQTT not connected; color not sent");
      return;
    }

    let hex = colorHex.trim();
    if (!hex.startsWith("#")) {
      hex = `#${hex}`;
    }

    const v1Payload = JSON.stringify({
      schemaVersion: 1,
      messageId: newMessageId(),
      sentAt: new Date().toISOString(),
      payload: { color: hex, brightness },
    });

    const legacyPayload = JSON.stringify({ color: hex });

    client.publish(MQTT_TOPICS.downlinkColor, v1Payload, { qos: 0 }, (err) => {
      if (err) {
        console.error("Publish v1 color error", err);
      }
    });
    client.publish(MQTT_TOPICS.legacyColor, legacyPayload, { qos: 0 }, (err) => {
      if (err) {
        console.error("Publish legacy color error", err);
      }
    });
  } catch (e) {
    console.error("sendColor error", e);
  }
}
