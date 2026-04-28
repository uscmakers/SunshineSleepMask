export type PlaybackAppSource = "idle" | "ambient" | "meditation" | "spotify";

export type GlobalAudioState = {
  currentTrack: string | null;
  currentTrackId: string | null;
  source: PlaybackAppSource;
  isPlaying: boolean;
  isPaused: boolean;
  /** Global volume 0–1, applied to expo-av (local) playback. */
  volume: number;
  /** Selected sleep timer 0 = off, up to 120, step 5. */
  sleepTimerSelectMin: number;
  /** Monotonic time when local playback should auto-stop, or null if not armed. */
  timerEndAt: number | null;
  /** Countdown for UI, seconds remaining (0 when not active). */
  sleepTimerSecondsRemaining: number;
  isLoadingLocal: boolean;
  lastError: string | null;
};

export type LocalPlayParams = {
  id: string;
  title: string;
  file: number;
  loop: boolean;
  source: "ambient" | "meditation";
};

export type GlobalAudioActions = {
  playLocal: (p: LocalPlayParams) => Promise<void>;
  toggleLocalForTrack: (p: LocalPlayParams) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (v: number) => void;
  /** 0 = off, 1–120. Resets armed timer if playing local. */
  setSleepTimerSelectMin: (m: number) => void;
  clearTimer: () => void;
  setSpotifyAccessToken: (token: string | null) => void;
  /** Resolves `null` on success, or a user-facing error message. */
  playSpotifyTrack: (uri: string, title: string) => Promise<string | null>;
  /** Any JSON body for `PUT /v1/me/player/play` (e.g. context_uri, uris). */
  playSpotifyWithBody: (body: Record<string, unknown>, title: string) => Promise<string | null>;
  getSpotifyAccessToken: () => string | null;
  spotifyApiPause: () => Promise<void>;
  setSpotifyTokenBundle: (
    bundle: { access: string; refresh: string; expiresAt: number } | null
  ) => void;
};

export type GlobalAudioValue = GlobalAudioState & GlobalAudioActions;
