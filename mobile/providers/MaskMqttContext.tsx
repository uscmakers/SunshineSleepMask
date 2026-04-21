import type { MaskTelemetry } from "@/hooks/mqttClient";
import {
  initMqtt,
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
};

const MaskMqttContext = createContext<MaskMqttContextValue | null>(null);

export function MaskMqttProvider({ children }: { children: React.ReactNode }) {
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<MaskTelemetry | null>(null);

  useEffect(() => {
    initMqtt();
    const unsubT = subscribeMaskTelemetry(setTelemetry);
    const unsubB = subscribeMqttBrokerState(setBrokerConnected);
    return () => {
      unsubT();
      unsubB();
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
    }),
    [brokerConnected, maskReachable, telemetry]
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
