import type { MaskAudioPlayback, MaskTelemetry } from "@/hooks/mqttClient";
import {
  initMqtt,
  subscribeMaskAudioState,
  subscribeMaskTelemetry,
  subscribeMqttBrokerState,
} from "@/hooks/mqttClient";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const HEARTBEAT_STALE_MS = 90_000;

type MaskMqttContextValue = {
  brokerConnected: boolean;
  /** Recent uplink heartbeat implies mask firmware is reachable. */
  maskReachable: boolean;
  telemetry: MaskTelemetry | null;
  /** Last `audio.state` from uplink when firmware publishes it. */
  maskAudio: MaskAudioPlayback | null;
};

const MaskMqttContext = createContext<MaskMqttContextValue | null>(null);

export function MaskMqttProvider({ children }: { children: React.ReactNode }) {
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<MaskTelemetry | null>(null);
  const [maskAudio, setMaskAudio] = useState<MaskAudioPlayback | null>(null);

  useEffect(() => {
    initMqtt();
    const unsubT = subscribeMaskTelemetry(setTelemetry);
    const unsubB = subscribeMqttBrokerState(setBrokerConnected);
    const unsubA = subscribeMaskAudioState(setMaskAudio);
    return () => {
      unsubT();
      unsubB();
      unsubA();
    };
  }, []);

  const maskReachable = useMemo(() => {
    if (!telemetry?.lastHeartbeatAt) {
      return false;
    }
    return Date.now() - telemetry.lastHeartbeatAt < HEARTBEAT_STALE_MS;
  }, [telemetry]);

  const value = useMemo(
    () => ({
      brokerConnected,
      maskReachable,
      telemetry,
      maskAudio,
    }),
    [brokerConnected, maskReachable, telemetry, maskAudio]
  );

  return (
    <MaskMqttContext.Provider value={value}>{children}</MaskMqttContext.Provider>
  );
}

export function useMaskMqtt() {
  const ctx = useContext(MaskMqttContext);
  if (!ctx) {
    throw new Error("useMaskMqtt must be used within MaskMqttProvider");
  }
  return ctx;
}
