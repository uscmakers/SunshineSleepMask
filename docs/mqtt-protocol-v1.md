# Sunshine Sleep Mask — MQTT protocol & topics (v1)

This document is the **single source of truth** for prototype MQTT messaging between the **mobile app (Expo)** and the **ESP32 mask firmware**, brokered via **Flespi** with a **fixed device namespace** (no multi-user / multi-device in v1).

**Conventions**

- **Base prefix:** `devices/sleepmask/`
- **JSON only** on all application payloads unless explicitly noted.
- Every payload includes **`schemaVersion`** (integer). Breaking changes bump this version and are documented in §9.
- **QoS:** v1 assumes **QoS 0** unless you later require at-least-once for alarm sync (then use QoS 1 on `…/downlink/alarms` only).
- **Timestamps:** ISO-8601 UTC strings (`"2026-04-14T12:34:56.789Z"`) where a timestamp appears, unless stated otherwise.

---

## 1. Topic map (v1 canonical)

| Direction | Topic | Publisher | Purpose |
|-----------|--------|-----------|---------|
| Downlink | `devices/sleepmask/downlink/alarms` | App → broker → ESP | Replace or patch alarm schedule; device ACKs on uplink. |
| Downlink | `devices/sleepmask/downlink/color` | App → ESP | Immediate LED color (manual / preview); does not cancel scheduled ramps unless firmware defines that. |
| Downlink | `devices/sleepmask/downlink/audio` | App → ESP | Audio transport control (see §5). |
| Downlink | `devices/sleepmask/downlink/system` | App → ESP | Optional: request full state dump, NTP re-sync trigger, reboot (use sparingly). |
| Uplink | `devices/sleepmask/uplink/heartbeat` | ESP → App | Liveness, RSSI, battery, firmware version (Home “connected”). |
| Uplink | `devices/sleepmask/uplink/alarms` | ESP → App | ACKs, error reports, and **authoritative** alarm snapshot after apply/resync. |
| Uplink | `devices/sleepmask/uplink/audio` | ESP → App | Playback state (track id, playing, position if available). |
| Uplink | `devices/sleepmask/uplink/log` | ESP → App | Optional debug strings / structured events (rate-limited in firmware). |

**Subscriptions (recommended)**

- **App:** subscribe to `devices/sleepmask/uplink/#` (or each uplink topic explicitly).
- **ESP32:** subscribe to `devices/sleepmask/downlink/#` (or each downlink topic explicitly).

### 1.1 Legacy prototype topics (deprecated)

Existing code may still use:

| Legacy topic | Replacement |
|--------------|-------------|
| `devices/sleepmask/color` | `devices/sleepmask/downlink/color` |
| `devices/sleepmask/status` | `devices/sleepmask/uplink/heartbeat` and/or `devices/sleepmask/uplink/alarms` |

New firmware and app code should implement **canonical v1 topics** first, then drop legacy aliases once both sides are updated.

---

## 2. Envelope & versioning

All JSON bodies share this top-level shape where applicable:

```json
{
  "schemaVersion": 1,
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "sentAt": "2026-04-14T12:34:56.789Z"
}
```

- **`messageId`:** Unique per logical message (UUID v4 is fine). Used for **idempotency** and **correlation** with ACKs.
- **`sentAt`:** When the sender created the message (optional but recommended on downlink).

**Rule:** Processors **must** ignore unknown fields. Emitters **should** include `schemaVersion` first for human debugging.

---

## 3. Alarms: hybrid sync (phone source of truth, ESP executes)

### 3.1 Alarm record (logical model)

Each alarm is one object:

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `alarmId` | string | yes | Stable ID from app; do not reuse after delete. |
| `enabled` | boolean | yes | |
| `localTime` | object | yes | `{ "hour": 0-23, "minute": 0-59 }` wall time **on the mask’s configured local calendar day**. |
| `daysOfWeek` | string[] | yes | Subset of `["mon","tue","wed","thu","fri","sat","sun"]`. Empty array means **disabled** or “never” — firmware should treat as disabled. |
| `timezoneOffsetMinutes` | integer | yes v1 | Minutes **east of UTC** for the user’s nominal timezone at scheduling time, e.g. `-420` for US Mountain **standard** offset **without** DST automation on the MCU. |
| `sunriseRampMinutes` | number | yes | Minutes for **local** brightness ramp ending at alarm time. `0` = instant at alarm time. |
| `targetColor` | string | yes | `"#RRGGBB"` hex color at end of ramp. |
| `snoozeMinutes` | number | yes | `0` = snooze off; otherwise snooze interval when user invokes snooze (hardware button or future signal). |

**DST note (v1):** Full IANA timezone rules on ESP32 are out of scope. v1 uses **`timezoneOffsetMinutes` as a snapshot**; the app should **re-push** alarm payloads when the user changes timezone or when DST transitions matter. Long-term you can add `ianaTimezone` as optional metadata for smarter devices.

### 3.2 Downlink: replace full schedule

**Topic:** `devices/sleepmask/downlink/alarms`  

**Type:** `alarms.replace_all`

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "sentAt": "…",
  "type": "alarms.replace_all",
  "payload": {
    "alarms": [
      {
        "alarmId": "a1",
        "enabled": true,
        "localTime": { "hour": 7, "minute": 0 },
        "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"],
        "timezoneOffsetMinutes": -420,
        "sunriseRampMinutes": 10,
        "targetColor": "#FFC46B",
        "snoozeMinutes": 9
      }
    ]
  }
}
```

Semantics:

- **Atomic replace:** the ESP’s stored schedule **becomes exactly** this list after successful apply.
- Firmware **persists** to NVS/flash after validation.
- **Execution** uses **RTC + NTP**; if WiFi drops, **alarms still run** from persisted data.

### 3.3 Downlink: partial update (optional v1)

**Type:** `alarms.patch`

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "type": "alarms.patch",
  "payload": {
    "upsert": [ { "alarmId": "a1", "…": "…" } ],
    "remove": ["a2"]
  }
}
```

If firmware omits patch handling in the first ESP32 build, the app may **only** use `replace_all` until patch is implemented.

### 3.4 Uplink: ACK + authoritative state

**Topic:** `devices/sleepmask/uplink/alarms`

**After every successful or failed apply** of a downlink alarms message:

```json
{
  "schemaVersion": 1,
  "messageId": "new-uuid-from-device",
  "correlationId": "same-as-downlink-messageId",
  "sentAt": "…",
  "type": "alarms.apply_result",
  "payload": {
    "ok": true,
    "errorCode": null,
    "errorMessage": null,
    "scheduleRevision": 42,
    "alarms": [ { "alarmId": "a1", "…": "…" } ],
    "nextFire": {
      "alarmId": "a1",
      "localTime": { "hour": 7, "minute": 0 },
      "nextEpochUtc": 1713091200
    }
  }
}
```

On validation failure:

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "correlationId": "…",
  "type": "alarms.apply_result",
  "payload": {
    "ok": false,
    "errorCode": "INVALID_FIELD",
    "errorMessage": "daysOfWeek empty for enabled alarm a1",
    "scheduleRevision": 41,
    "alarms": [ … last known good … ]
  }
}
```

**`scheduleRevision`:** Monotonic integer incremented on every successful mutation; app can compare to detect drift and **resync** (send `replace_all` from local DB).

**Unsolicited uplink:** Firmware **may** publish `type: "alarms.state"` with the same `payload.alarms` shape on boot **before** any downlink, so the app can reconcile.

---

## 4. Immediate LED color (downlink)

**Topic:** `devices/sleepmask/downlink/color`

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "payload": {
    "color": "#RRGGBB",
    "brightness": 1.0
  }
}
```

- **`brightness`:** Optional float `0.0–1.0` multiplier applied to RGB in firmware. Omit = `1.0`.
- Does not by itself define sunrise behavior; ramps are driven locally from alarm parameters (§3).

---

## 5. Audio v1 contract (explicit)

### 5.1 Codec & format

| Item | v1 specification |
|------|------------------|
| **Primary codec** | **MP3**, constant bitrate (**CBR**) **128 kbps**, **44.1 kHz**, **mono** preferred (stereo acceptable if firmware downmixes). |
| **Optional secondary** | **WAV**, **PCM 16-bit signed little-endian**, **mono or stereo**, **44.1 kHz** (for short assets such as chimes; avoid large files). |
| **Not in v1** | AAC, Opus, FLAC (may be added in `schemaVersion: 2` with capability flags in heartbeat). |

Firmware should expose **`audioCapabilities`** in heartbeat (§6) listing supported codecs.

### 5.2 Source of audio bits

| Mode | v1 support | Description |
|------|------------|-------------|
| **`https_url`** | **Required for v1 music/ambient** | ESP performs **HTTPS GET** (and optional **HTTP Range** if firmware supports seeking). URL must be **TLS**; certificate validation **enabled** (pinning optional later). |
| **`mqtt_base64_chunked`** | **Not required in v1** | Reserved; avoid for large assets due to flash/RAM and broker overhead. |

The **app does not stream PCM to the mask** in v1; it sends **commands + URLs** (or future catalog ids resolved to URLs on device).

### 5.3 Transport identifiers

| Field | Description |
|-------|-------------|
| `trackId` | Stable string chosen by app (e.g. uuid) for UI correlation; echoed in state. |
| `url` | HTTPS URL to MP3 or WAV for `load` / `queue`. |

### 5.4 Downlink: audio control

**Topic:** `devices/sleepmask/downlink/audio`

All messages use the envelope +:

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "type": "audio.load",
  "payload": {
    "trackId": "t-123",
    "url": "https://cdn.example.com/ambient/rain.mp3",
    "codecHint": "mp3_cbr_128_mono"
  }
}
```

**Types (v1 minimum set)**

| `type` | `payload` | Behavior |
|--------|-------------|----------|
| `audio.load` | `trackId`, `url`, optional `codecHint` | Stop current, decode from URL, **pause** at start or **play** per product default (recommend **pause** until `audio.play`). |
| `audio.play` | optional `{ "trackId": "t-123" }` | Play current or specified loaded track. |
| `audio.pause` | optional `trackId` | Pause. |
| `audio.stop` | optional `trackId` | Stop and release decoder buffers. |
| `audio.set_volume` | `{ "level": 0.0-1.0 }` | Software volume before MAX98357 (recommended default steps: 0.01 granularity). |
| `audio.sleep_timer` | `{ "seconds": 0 }` | `0` = cancel sleep timer; `>0` = stop playback after N seconds from command receipt (or from play start — pick one in firmware and document in ACK). |

Optional later (not required v1): `audio.seek_ms`, `audio.queue`, `audio.fade_ms`.

### 5.5 Uplink: audio state

**Topic:** `devices/sleepmask/uplink/audio`

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "sentAt": "…",
  "type": "audio.state",
  "payload": {
    "state": "playing",
    "trackId": "t-123",
    "positionMs": 12000,
    "durationMs": 180000,
    "volume": 0.35,
    "sleepTimerRemainingSec": 0,
    "error": null
  }
}
```

`state` enum: `idle` | `loading` | `playing` | `paused` | `stopped` | `error`.

---

## 6. Heartbeat & battery (uplink)

**Topic:** `devices/sleepmask/uplink/heartbeat`  

Publish every **15–60 s** while connected (tune for battery); also immediately after **MQTT connect**.

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "sentAt": "…",
  "type": "device.heartbeat",
  "payload": {
    "firmwareVersion": "0.1.0",
    "wifiRssiDbm": -62,
    "batteryPercent": 87,
    "batteryMv": 3900,
    "uptimeSec": 3600,
    "audioCapabilities": ["mp3_cbr", "wav_pcm_s16le"],
    "nextFire": {
      "alarmId": "a1",
      "nextEpochUtc": 1713091200
    }
  }
}
```

- **`batteryPercent`:** `0–100` or `null` if unknown.
- **App “connected”:** e.g. heartbeat received within **2× publish interval + skew** (product decision).

---

## 7. System downlink (optional)

**Topic:** `devices/sleepmask/downlink/system`

```json
{
  "schemaVersion": 1,
  "messageId": "…",
  "type": "system.request_state",
  "payload": {}
}
```

Firmware responds by publishing **alarms state** (if changed or on demand), **audio state**, and/or an extended heartbeat. Exact mapping is implementation-defined but **must** be documented in firmware README when used.

---

## 8. Operational: secrets & git

- **Never** commit Flespi tokens, Wi-Fi passwords, or URLs with embedded credentials.
- **Rotate** any credential that has appeared in git history; treat historical commits as compromised.
- Use **per-environment** tokens where possible; restrict Flespi ACLs to the minimal topic prefix `devices/sleepmask/#`.
- **Firmware:** keep secrets in `mask_microcontroller/secrets.h` (gitignored). Copy from `mask_microcontroller/secrets.h.example` and fill in real values.
- **Mobile:** use `.env` with `FLESPI_TOKEN` / `DEVICE_ID` (see `mobile/app.config.js`); `.env` is already gitignored there.

---

## 9. Revision history (protocol)

| `schemaVersion` | Summary |
|-----------------|--------|
| **1** | Initial canonical topics (`downlink/*`, `uplink/*`); alarms replace_all/patch; hybrid ACK; audio URL + MP3/WAV; heartbeat with battery. |

**Bump `schemaVersion`** when a field becomes required, a type enum changes, or topic semantics break compatibility. Prefer additive optional fields within the same major version when possible.

---

## 10. Example flow (alarm edit)

1. User saves alarm in app → app updates local DB → publish `alarms.replace_all` to `…/downlink/alarms` with new `messageId`.
2. ESP validates, persists, schedules RTC → publish `alarms.apply_result` with same `correlationId`, `ok: true`, new `scheduleRevision`.
3. App marks sync complete; Home shows “connected” from recent `heartbeat`.

If publish fails (offline), app queues; on reconnect, ESP may publish `alarms.state` first → app compares `scheduleRevision` / contents and **re-sends** if needed.

---

*End of v1 spec.*
