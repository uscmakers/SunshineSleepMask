import * as WebBrowser from "expo-web-browser";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import type {
  GlobalAudioState,
  GlobalAudioValue,
  LocalPlayParams,
} from "@/audio/types";
import { getSpotifyClientId } from "@/spotify/spotifyConfig";
import {
  getPlaybackItemMeta,
  type PlaybackItemMeta,
  refreshSpotifyAccessToken,
  resolveSpotifyPlaybackDevice,
  spotifyFriendlyPlayError,
  spotifyPauseWeb,
  spotifyPlayerNext,
  spotifyPlayerPrevious,
  spotifyPlayUris,
  spotifyPlayWithBody,
  spotifyResumeOnDevice,
} from "@/spotify/spotifyWebApi";

WebBrowser.maybeCompleteAuthSession();

/** After starting playlist/podcast context, Spotify reports the real track shortly after. */
async function pollPlaybackItemMeta(token: string): Promise<PlaybackItemMeta | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 320));
    }
    const meta = await getPlaybackItemMeta(token);
    if (meta) return meta;
  }
  return null;
}

function mergeSpotifyMetaIntoState(s: GlobalAudioState, meta: PlaybackItemMeta): GlobalAudioState {
  return {
    ...s,
    currentTrack: meta.title,
    currentTrackId: meta.uri ?? "spotify:player",
    isPlaying: meta.isPlaying,
    isPaused: !meta.isPlaying,
  };
}

const initial: GlobalAudioState = {
  currentTrack: null,
  currentTrackId: null,
  source: "idle",
  isPlaying: false,
  isPaused: false,
  volume: 0.75,
  sleepTimerSelectMin: 0,
  timerEndAt: null,
  sleepTimerSecondsRemaining: 0,
  isLoadingLocal: false,
  lastError: null,
};

const Ctx = createContext<GlobalAudioValue | null>(null);

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type SpotifyBundle = { access: string; refresh: string; expiresAt: number };

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<GlobalAudioState>(initial);
  /** Bumps when Spotify token bundle changes so consumers and getters stay fresh. */
  const [spotifyGen, setSpotifyGen] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const endTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickId = useRef<ReturnType<typeof setInterval> | null>(null);
  const spotifyRef = useRef<SpotifyBundle | null>(null);
  const stRef = useRef(st);
  stRef.current = st;
  const sleepMinRef = useRef(st.sleepTimerSelectMin);
  sleepMinRef.current = st.sleepTimerSelectMin;

  const setErr = useCallback((m: string | null) => setSt((s) => ({ ...s, lastError: m })), []);

  const clearEnd = useCallback(() => {
    if (endTimerId.current) {
      clearTimeout(endTimerId.current);
      endTimerId.current = null;
    }
  }, []);

  const clearTick = useCallback(() => {
    if (tickId.current) {
      clearInterval(tickId.current);
      tickId.current = null;
    }
  }, []);

  const updateTick = useCallback(() => {
    setSt((s) => {
      if (!s.timerEndAt) {
        return s.sleepTimerSecondsRemaining === 0 ? s : { ...s, sleepTimerSecondsRemaining: 0 };
      }
      const r = Math.max(0, Math.floor((s.timerEndAt - Date.now()) / 1000));
      if (r <= 0) {
        return { ...s, sleepTimerSecondsRemaining: 0, timerEndAt: null };
      }
      return s.sleepTimerSecondsRemaining === r ? s : { ...s, sleepTimerSecondsRemaining: r };
    });
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    tickId.current = setInterval(updateTick, 1000);
    updateTick();
  }, [clearTick, updateTick]);

  const unloadLocal = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      await s.stopAsync();
    } catch {
      /* */
    }
    try {
      await s.unloadAsync();
    } catch {
      /* */
    }
    soundRef.current = null;
  }, []);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      setSt((s) => ({ ...s, isPlaying: false, isPaused: false }));
      return;
    }
    setSt((s) => ({
      ...s,
      isPlaying: status.isPlaying,
      isPaused: !status.isPlaying && (status.positionMillis ?? 0) > 0,
    }));
  }, []);

  const refreshSpotifyIfNeeded = useCallback(async () => {
    const b = spotifyRef.current;
    if (!b) return;
    const skewMs = 60_000;
    if (Date.now() < b.expiresAt - skewMs) return;

    const clientId = getSpotifyClientId();
    if (!b.refresh || !clientId) {
      spotifyRef.current = null;
      setSpotifyGen((g) => g + 1);
      return;
    }

    try {
      const next = await refreshSpotifyAccessToken(clientId, b.refresh);
      spotifyRef.current = {
        access: next.access,
        refresh: next.refresh,
        expiresAt: next.expiresAt,
      };
      setSpotifyGen((g) => g + 1);
    } catch {
      spotifyRef.current = null;
      setSpotifyGen((g) => g + 1);
    }
  }, []);

  const scheduleSleepTimer = useCallback(
    (minutes: number) => {
      clearEnd();
      if (minutes <= 0) {
        setSt((s) => ({ ...s, timerEndAt: null, sleepTimerSecondsRemaining: 0 }));
        clearTick();
        return;
      }
      const at = Date.now() + minutes * 60_000;
      setSt((s) => ({ ...s, timerEndAt: at }));
      startTick();
      endTimerId.current = setTimeout(() => {
        void (async () => {
          const cur = stRef.current;
          if (cur.source === "spotify" && spotifyRef.current) {
            try {
              await refreshSpotifyIfNeeded();
              if (spotifyRef.current) {
                await spotifyPauseWeb(spotifyRef.current.access);
              }
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Sleep timer stop failed");
            }
            setSt((s) => ({
              ...s,
              isPlaying: false,
              isPaused: false,
              currentTrack: null,
              currentTrackId: null,
              source: "idle",
              timerEndAt: null,
              sleepTimerSecondsRemaining: 0,
              sleepTimerSelectMin: 0,
            }));
            clearTick();
            return;
          }
          if (cur.source !== "ambient" && cur.source !== "meditation") {
            setSt((s) => ({ ...s, timerEndAt: null, sleepTimerSecondsRemaining: 0 }));
            clearTick();
            return;
          }
          try {
            await unloadLocal();
          } catch {
            /* */
          }
          setSt((prev) => ({
            ...initial,
            volume: prev.volume,
            lastError: null,
          }));
          clearTick();
        })();
      }, minutes * 60_000);
    },
    [clearEnd, clearTick, startTick, unloadLocal, refreshSpotifyIfNeeded, setErr]
  );

  const rearmLocalTimer = useCallback(
    (minutes: number) => {
      scheduleSleepTimer(minutes);
    },
    [scheduleSleepTimer]
  );

  const stop = useCallback(async () => {
    setErr(null);
    clearEnd();
    clearTick();
    if (stRef.current.source === "spotify" && spotifyRef.current) {
      try {
        await refreshSpotifyIfNeeded();
        if (spotifyRef.current) {
          await spotifyPauseWeb(spotifyRef.current.access);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Spotify stop failed");
      }
      setSt((s) => ({
        ...s,
        isPlaying: false,
        isPaused: false,
        currentTrack: null,
        currentTrackId: null,
        source: "idle",
        timerEndAt: null,
        sleepTimerSecondsRemaining: 0,
      }));
      return;
    }
    await unloadLocal();
    setSt((s) => ({
      ...s,
      isPlaying: false,
      isPaused: false,
      currentTrack: null,
      currentTrackId: null,
      source: "idle",
      timerEndAt: null,
      sleepTimerSecondsRemaining: 0,
    }));
  }, [clearEnd, clearTick, refreshSpotifyIfNeeded, setErr, unloadLocal]);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const vol = clamp01(v);
    setSt((s) => ({ ...s, volume: vol }));
    if (soundRef.current) {
      void soundRef.current.setVolumeAsync(vol);
    }
  }, []);

  const setSleepTimerSelectMin = useCallback(
    (m: number) => {
      const min = m <= 0 ? 0 : Math.max(0, Math.min(120, Math.round(m / 5) * 5));
      sleepMinRef.current = min;
      if (min <= 0) {
        clearEnd();
        clearTick();
        setSt((s) => ({
          ...s,
          sleepTimerSelectMin: 0,
          timerEndAt: null,
          sleepTimerSecondsRemaining: 0,
        }));
        return;
      }
      setSt((s) => ({ ...s, sleepTimerSelectMin: min }));
      const s = stRef.current;
      if ((s.source === "ambient" || s.source === "meditation") && s.isPlaying) {
        rearmLocalTimer(min);
      }
      if (s.source === "spotify" && s.isPlaying) {
        scheduleSleepTimer(min);
      }
    },
    [rearmLocalTimer, clearEnd, clearTick, scheduleSleepTimer]
  );

  const clearTimer = useCallback(() => {
    sleepMinRef.current = 0;
    clearEnd();
    clearTick();
    setSt((s) => ({
      ...s,
      sleepTimerSelectMin: 0,
      timerEndAt: null,
      sleepTimerSecondsRemaining: 0,
    }));
  }, [clearEnd, clearTick]);

  const playLocal = useCallback(
    async (p: LocalPlayParams) => {
      setErr(null);
      if (stRef.current.source === "spotify" && spotifyRef.current) {
        try {
          await refreshSpotifyIfNeeded();
          if (!spotifyRef.current) return;
          await spotifyPauseWeb(spotifyRef.current.access);
        } catch {
          /* */
        }
      }
      setSt((s) => ({ ...s, isLoadingLocal: true, source: "idle" }));
      await unloadLocal();
      const vol = stRef.current.volume;
      const sel = sleepMinRef.current;
      try {
        const { sound } = await Audio.Sound.createAsync(
          p.file,
          { shouldPlay: true, isLooping: p.loop, volume: vol },
          onPlaybackStatus
        );
        soundRef.current = sound;
        setSt((s) => ({
          ...s,
          isLoadingLocal: false,
          currentTrack: p.title,
          currentTrackId: p.id,
          source: p.source,
          isPlaying: true,
          isPaused: false,
        }));
        if (sel > 0) rearmLocalTimer(sel);
        else rearmLocalTimer(0);
      } catch (e) {
        setSt((s) => ({ ...s, isLoadingLocal: false, source: "idle" }));
        setErr(e instanceof Error ? e.message : "Local playback failed");
      }
    },
    [onPlaybackStatus, rearmLocalTimer, refreshSpotifyIfNeeded, setErr, unloadLocal]
  );

  const toggleLocalForTrack = useCallback(
    async (p: LocalPlayParams) => {
      const s = stRef.current;
      if (s.currentTrackId === p.id && (s.isPlaying || s.isPaused)) {
        if (s.isPlaying && soundRef.current) {
          try {
            await soundRef.current.pauseAsync();
          } catch {
            /* */
          }
          return;
        }
        if (s.isPaused && soundRef.current) {
          try {
            await soundRef.current.playAsync();
            const sel = sleepMinRef.current;
            if (sel > 0) rearmLocalTimer(sel);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Resume failed");
          }
        }
        return;
      }
      await playLocal(p);
    },
    [playLocal, rearmLocalTimer, setErr]
  );

  const pause = useCallback(async () => {
    if (stRef.current.source === "spotify" && spotifyRef.current) {
      try {
        await refreshSpotifyIfNeeded();
        if (spotifyRef.current) {
          await spotifyPauseWeb(spotifyRef.current.access);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Pause failed");
      }
      setSt((s) => ({ ...s, isPlaying: false, isPaused: true }));
      return;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        clearEnd();
        setSt((s) => ({ ...s, timerEndAt: null, sleepTimerSecondsRemaining: 0 }));
        clearTick();
      } catch {
        /* */
      }
    }
  }, [clearEnd, clearTick, refreshSpotifyIfNeeded, setErr]);

  const resume = useCallback(async () => {
    if (stRef.current.source === "spotify" && spotifyRef.current) {
      try {
        await refreshSpotifyIfNeeded();
        if (!spotifyRef.current) return;
        const token = spotifyRef.current.access;
        const resolved = await resolveSpotifyPlaybackDevice(token);
        if (!resolved.ok) {
          setErr(resolved.message);
          return;
        }
        const res = await spotifyResumeOnDevice(token, resolved.deviceId);
        if (res.status === 204 || res.ok) {
          setSt((s) => ({ ...s, isPlaying: true, isPaused: false }));
          const sel = sleepMinRef.current;
          if (sel > 0) {
            scheduleSleepTimer(sel);
          }
        } else {
          const txt = await res.text();
          setErr(spotifyFriendlyPlayError(res.status, txt));
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Spotify resume failed");
      }
      return;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
        const sel = sleepMinRef.current;
        if (sel > 0) rearmLocalTimer(sel);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Resume failed");
      }
    }
  }, [rearmLocalTimer, refreshSpotifyIfNeeded, scheduleSleepTimer, setErr]);

  const setSpotifyTokenBundle = useCallback(
    (b: { access: string; refresh: string; expiresAt: number } | null) => {
      spotifyRef.current = b;
      setSpotifyGen((g) => g + 1);
    },
    []
  );

  const getSpotifyAccessToken = useCallback(async (): Promise<string | null> => {
    await refreshSpotifyIfNeeded();
    return spotifyRef.current?.access ?? null;
  }, [refreshSpotifyIfNeeded, spotifyGen]);

  const setSpotifyAccessToken = useCallback((t: string | null) => {
    if (t) {
      spotifyRef.current = { access: t, refresh: "", expiresAt: 0 };
    } else {
      spotifyRef.current = null;
    }
    setSpotifyGen((g) => g + 1);
  }, []);

  const playSpotifyTrack = useCallback(
    async (uri: string, title: string): Promise<string | null> => {
      setErr(null);
      await refreshSpotifyIfNeeded();
      if (!spotifyRef.current) {
        const m = "Not connected to Spotify";
        setErr(m);
        return m;
      }
      const token = spotifyRef.current.access;
      const resolved = await resolveSpotifyPlaybackDevice(token);
      if (!resolved.ok) {
        setErr(resolved.message);
        return resolved.message;
      }
      await unloadLocal();
      clearEnd();
      clearTick();
      setSt((s) => ({
        ...s,
        isPlaying: false,
        isPaused: false,
        currentTrack: title,
        currentTrackId: uri,
        source: "spotify",
        timerEndAt: null,
        sleepTimerSecondsRemaining: 0,
      }));
      const res = await spotifyPlayUris(token, [uri], resolved.deviceId);
      if (!res.ok) {
        const txt = await res.text();
        const msg = spotifyFriendlyPlayError(res.status, txt);
        setErr(msg);
        setSt((s) => ({
          ...s,
          isPlaying: false,
          isPaused: false,
          currentTrack: null,
          currentTrackId: null,
          source: "idle",
          timerEndAt: null,
          sleepTimerSecondsRemaining: 0,
        }));
        return msg;
      }
      setSt((s) => ({ ...s, isPlaying: true, isPaused: false }));
      const selAfter = sleepMinRef.current;
      if (selAfter > 0) {
        scheduleSleepTimer(selAfter);
      }
      void (async () => {
        const meta = await pollPlaybackItemMeta(token);
        if (!meta) return;
        setSt((s) => (s.source === "spotify" ? mergeSpotifyMetaIntoState(s, meta) : s));
      })();
      return null;
    },
    [clearEnd, clearTick, refreshSpotifyIfNeeded, scheduleSleepTimer, setErr, unloadLocal]
  );

  const playSpotifyWithBody = useCallback(
    async (body: Record<string, unknown>, title: string): Promise<string | null> => {
      setErr(null);
      await refreshSpotifyIfNeeded();
      if (!spotifyRef.current) {
        const m = "Not connected to Spotify";
        setErr(m);
        return m;
      }
      const token = spotifyRef.current.access;
      const resolved = await resolveSpotifyPlaybackDevice(token);
      if (!resolved.ok) {
        setErr(resolved.message);
        return resolved.message;
      }
      await unloadLocal();
      clearEnd();
      clearTick();
      setSt((s) => ({
        ...s,
        isPlaying: false,
        isPaused: false,
        currentTrack: title,
        currentTrackId: "spotify:player",
        source: "spotify",
        timerEndAt: null,
        sleepTimerSecondsRemaining: 0,
      }));
      const res = await spotifyPlayWithBody(token, body, resolved.deviceId);
      if (!res.ok) {
        const txt = await res.text();
        const msg = spotifyFriendlyPlayError(res.status, txt);
        setErr(msg);
        setSt((s) => ({
          ...s,
          isPlaying: false,
          isPaused: false,
          currentTrack: null,
          currentTrackId: null,
          source: "idle",
          timerEndAt: null,
          sleepTimerSecondsRemaining: 0,
        }));
        return msg;
      }
      setSt((s) => ({ ...s, isPlaying: true, isPaused: false }));
      const selAfter = sleepMinRef.current;
      if (selAfter > 0) {
        scheduleSleepTimer(selAfter);
      }
      void (async () => {
        const meta = await pollPlaybackItemMeta(token);
        if (!meta) return;
        setSt((s) => (s.source === "spotify" ? mergeSpotifyMetaIntoState(s, meta) : s));
      })();
      return null;
    },
    [clearEnd, clearTick, refreshSpotifyIfNeeded, scheduleSleepTimer, setErr, unloadLocal]
  );

  const refreshSpotifyPlaybackDisplay = useCallback(async () => {
    if (stRef.current.source !== "spotify" || !spotifyRef.current) return;
    try {
      await refreshSpotifyIfNeeded();
      if (!spotifyRef.current || stRef.current.source !== "spotify") return;
      const meta = await getPlaybackItemMeta(spotifyRef.current.access);
      if (!meta) return;
      setSt((s) => (s.source === "spotify" ? mergeSpotifyMetaIntoState(s, meta) : s));
    } catch {
      /* */
    }
  }, [refreshSpotifyIfNeeded]);

  useEffect(() => {
    if (st.source !== "spotify") return;
    void refreshSpotifyPlaybackDisplay();
    const id = setInterval(() => void refreshSpotifyPlaybackDisplay(), 4000);
    return () => clearInterval(id);
  }, [st.source, spotifyGen, refreshSpotifyPlaybackDisplay]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void refreshSpotifyPlaybackDisplay();
    });
    return () => sub.remove();
  }, [refreshSpotifyPlaybackDisplay]);

  const spotifySkipNext = useCallback(async () => {
    if (stRef.current.source !== "spotify" || !spotifyRef.current) return;
    try {
      await refreshSpotifyIfNeeded();
      if (!spotifyRef.current) return;
      const token = spotifyRef.current.access;
      const resolved = await resolveSpotifyPlaybackDevice(token);
      if (!resolved.ok) {
        setErr(resolved.message);
        return;
      }
      const res = await spotifyPlayerNext(token, resolved.deviceId);
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        setErr(spotifyFriendlyPlayError(res.status, txt));
        return;
      }
      void (async () => {
        const meta = await pollPlaybackItemMeta(token);
        if (!meta) return;
        setSt((s) => (s.source === "spotify" ? mergeSpotifyMetaIntoState(s, meta) : s));
      })();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Skip failed");
    }
  }, [refreshSpotifyIfNeeded, setErr]);

  const spotifySkipPrevious = useCallback(async () => {
    if (stRef.current.source !== "spotify" || !spotifyRef.current) return;
    try {
      await refreshSpotifyIfNeeded();
      if (!spotifyRef.current) return;
      const token = spotifyRef.current.access;
      const resolved = await resolveSpotifyPlaybackDevice(token);
      if (!resolved.ok) {
        setErr(resolved.message);
        return;
      }
      const res = await spotifyPlayerPrevious(token, resolved.deviceId);
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        setErr(spotifyFriendlyPlayError(res.status, txt));
        return;
      }
      void (async () => {
        const meta = await pollPlaybackItemMeta(token);
        if (!meta) return;
        setSt((s) => (s.source === "spotify" ? mergeSpotifyMetaIntoState(s, meta) : s));
      })();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Skip failed");
    }
  }, [refreshSpotifyIfNeeded, setErr]);

  const spotifyApiPause = useCallback(async () => {
    if (!spotifyRef.current) return;
    try {
      await refreshSpotifyIfNeeded();
      if (!spotifyRef.current) return;
      await spotifyPauseWeb(spotifyRef.current.access);
      setSt((s) => ({ ...s, isPlaying: false, isPaused: true }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Spotify pause failed");
    }
  }, [refreshSpotifyIfNeeded, setErr]);

  const value: GlobalAudioValue = useMemo(
    () => ({
      ...st,
      playLocal,
      toggleLocalForTrack,
      pause,
      resume,
      stop,
      setVolume,
      setSleepTimerSelectMin,
      clearTimer,
      setSpotifyAccessToken,
      playSpotifyTrack,
      playSpotifyWithBody,
      getSpotifyAccessToken,
      spotifyApiPause,
      spotifySkipNext,
      spotifySkipPrevious,
      refreshSpotifyPlaybackDisplay,
      setSpotifyTokenBundle,
    }),
    [
      st,
      spotifyGen,
      playLocal,
      toggleLocalForTrack,
      pause,
      resume,
      stop,
      setVolume,
      setSleepTimerSelectMin,
      clearTimer,
      setSpotifyAccessToken,
      playSpotifyTrack,
      playSpotifyWithBody,
      getSpotifyAccessToken,
      spotifyApiPause,
      spotifySkipNext,
      spotifySkipPrevious,
      refreshSpotifyPlaybackDisplay,
      setSpotifyTokenBundle,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGlobalAudio() {
  const c = useContext(Ctx);
  if (!c) {
    throw new Error("useGlobalAudio must be used within GlobalAudioProvider");
  }
  return c;
}
