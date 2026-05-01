#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_DotStarMatrix.h>
#include <Adafruit_DotStar.h>
#include "AudioTools.h"
#include "BluetoothA2DPSink.h"
#include <ArduinoJson.h>

#ifndef PSTR
 #define PSTR
#endif

// =====================
// Pins
// =====================
#define DATAPIN   14
#define CLOCKPIN  13
#define I2S_BCLK   2
#define I2S_WCLK   4
#define I2S_DOUT  15

// =====================
// WiFi / MQTT
// =====================
const char* WIFI_SSID        = "USC Guest Wireless";
const char* WIFI_PASSWORD    = "";
const char* MQTT_HOST        = "mqtt.flespi.io";
const int   MQTT_PORT        = 1883;
const char* MQTT_TOKEN       = "jhIgc6MC1zVOGzhroq483pUhzXZSRhW9NfQR20OCOMf2Rgb2nmKRpzYPTszjDWCd";
const char* DEVICE_ID        = "esp32-client";

// =====================
// Topics
// =====================
const char* SUB_COLOR    = "devices/sleepmask/color";
const char* SUB_ALARM    = "devices/sleepmask/alarm/set";
const char* SUB_SEQUENCE = "devices/sleepmask/sequence";   // NEW
const char* PUB_STATUS   = "devices/sleepmask/status";
const char* PUB_HB       = "devices/sleepmask/heartbeat";

// =====================
// Matrix
// =====================
Adafruit_DotStarMatrix matrix = Adafruit_DotStarMatrix(
  16, 8, DATAPIN, CLOCKPIN,
  DS_MATRIX_TOP + DS_MATRIX_RIGHT +
  DS_MATRIX_COLUMNS + DS_MATRIX_PROGRESSIVE,
  DOTSTAR_BRG);

WiFiClient   espClient;
PubSubClient mqttClient(espClient);
I2SStream    i2s;
BluetoothA2DPSink a2dp_sink(i2s);

// =====================
// Animation mode enum
// =====================
enum AnimMode {
  MODE_SCROLL,      // default scrolling text
  MODE_SOLID,       // single static color
  MODE_SEQUENCE,    // cycling through a published color list
  MODE_SUNRISE,     // alarm sunrise ramp
  MODE_PULSE,       // gentle pulse on a single color
  MODE_RAINBOW      // full hue sweep
};

AnimMode currentMode = MODE_SCROLL;

// =====================
// Solid / pulse state
// =====================
uint8_t solidR = 255, solidG = 100, solidB = 0;  // warm white default
float   pulsePhase = 0.0f;

// =====================
// Sequence state
// =====================
struct ColorEntry { uint8_t r, g, b; };
static ColorEntry seqColors[32];
int      seqLen          = 0;
int      seqIndex        = 0;
uint32_t seqHoldMs       = 1000;   // ms per color
uint32_t lastSeqStep     = 0;
bool     seqFade         = true;   // crossfade between steps
float    fadeFrac        = 0.0f;   // 0..1 between seqIndex and next

// =====================
// Sunrise / alarm state
// =====================
bool     alarmActive     = false;
uint32_t alarmStartMs    = 0;
uint32_t alarmDurationMs = 15UL * 60UL * 1000UL;  // default 15 min
float    alarmMaxBright  = 0.8f;                   // 0..1
uint8_t  baseBrightness  = 40;                     // matrix default

// =====================
// Scroll state
// =====================
int      scrollX      = 0;
int      scrollPass   = 0;
uint32_t lastScroll   = 0;
const int SCROLL_MS   = 40;
const uint16_t scrollColors[] = {
  0, // filled in setup()
  0,
  0
};

// =====================
// MQTT timing
// =====================
uint32_t lastMqttAttempt = 0;
const int MQTT_RETRY_MS  = 5000;
uint32_t lastHeartbeat   = 0;
const int HEARTBEAT_MS   = 10000;

// =====================
// Helpers
// =====================
void parseHex(const char* hex, uint8_t &r, uint8_t &g, uint8_t &b) {
  String h = hex;
  if (h.startsWith("#")) h = h.substring(1);
  if (h.length() != 6) { r = g = b = 255; return; }
  r = strtol(h.substring(0,2).c_str(), nullptr, 16);
  g = strtol(h.substring(2,4).c_str(), nullptr, 16);
  b = strtol(h.substring(4,6).c_str(), nullptr, 16);
}

uint16_t rgb(uint8_t r, uint8_t g, uint8_t b) {
  return matrix.Color(r, g, b);
}

// Lerp two 0-255 channels
uint8_t lerpU8(uint8_t a, uint8_t b, float t) {
  return (uint8_t)(a + (b - a) * t);
}

// HSV → RGB (h 0-360, s/v 0-1)
void hsvToRgb(float h, float s, float v, uint8_t &r, uint8_t &g, uint8_t &b) {
  float c = v * s, x = c * (1 - fabs(fmod(h / 60.0f, 2) - 1)), m = v - c;
  float rr=0,gg=0,bb=0;
  if      (h < 60)  { rr=c; gg=x; }
  else if (h < 120) { rr=x; gg=c; }
  else if (h < 180) { gg=c; bb=x; }
  else if (h < 240) { gg=x; bb=c; }
  else if (h < 300) { rr=x; bb=c; }
  else              { rr=c; bb=x; }
  r=(uint8_t)((rr+m)*255);
  g=(uint8_t)((gg+m)*255);
  b=(uint8_t)((bb+m)*255);
}

// =====================
// Fill entire matrix with one color
// =====================
void fillMatrix(uint8_t r, uint8_t g, uint8_t b) {
  matrix.fillScreen(0);
  uint16_t c = rgb(r, g, b);
  for (int y = 0; y < 8; y++)
    for (int x = 0; x < 16; x++)
      matrix.drawPixel(x, y, c);
  matrix.show();
}

// =====================
// WiFi
// =====================
void connectWiFi() {
  Serial.print(F("WiFi: "));
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t t = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print('.');
    if (millis()-t > 15000) { Serial.println(F("\nTimeout")); return; }
  }
  Serial.println("\nIP: " + WiFi.localIP().toString());
}

// =====================
// MQTT callback
// =====================
void mqttCallback(char* topic, byte* payload, unsigned int len) {
  String msg; msg.reserve(len);
  for (unsigned int i=0;i<len;i++) msg += (char)payload[i];
  Serial.print(F("MQTT [")); Serial.print(topic); Serial.print(F("]: ")); Serial.println(msg);

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, msg);
  if (err) { Serial.print(F("JSON err: ")); Serial.println(err.c_str()); return; }

  // ── /color ─────────────────────────────────────────────────────────────
  // Payload: { "color": "#RRGGBB" }
  // Optional: { "color": "#RRGGBB", "mode": "pulse" }
  if (String(topic) == SUB_COLOR) {
    const char* hexStr = doc["color"];
    if (!hexStr) return;

    parseHex(hexStr, solidR, solidG, solidB);
    const char* modeStr = doc["mode"] | "solid";

    if      (String(modeStr) == "pulse")   { currentMode = MODE_PULSE; pulsePhase = 0; }
    else if (String(modeStr) == "rainbow") { currentMode = MODE_RAINBOW; }
    else                                    { currentMode = MODE_SOLID; }

    Serial.print(F("Color mode: ")); Serial.println(modeStr);
  }

  // ── /sequence ──────────────────────────────────────────────────────────
  // Payload: {
  //   "colors": ["#FF0000","#00FF00","#0000FF"],
  //   "holdMs": 800,
  //   "fade": true
  // }
  else if (String(topic) == SUB_SEQUENCE) {
    JsonArray arr = doc["colors"].as<JsonArray>();
    if (arr.isNull() || arr.size() == 0) return;

    seqLen = min((int)arr.size(), 32);
    for (int i = 0; i < seqLen; i++) {
      const char* h = arr[i];
      parseHex(h, seqColors[i].r, seqColors[i].g, seqColors[i].b);
    }
    seqHoldMs   = doc["holdMs"] | 1000;
    seqFade     = doc["fade"]   | true;
    seqIndex    = 0;
    fadeFrac    = 0.0f;
    lastSeqStep = millis();
    currentMode = MODE_SEQUENCE;
    Serial.print(F("Sequence loaded: ")); Serial.print(seqLen); Serial.println(F(" colors"));
  }

  // ── /alarm/set ─────────────────────────────────────────────────────────
  // Payload: { "sunriseDuration": 15, "brightness": 0.8 }
  // Optional: { ..., "startNow": true }   (default = start immediately)
  else if (String(topic) == SUB_ALARM) {
    int   dur    = doc["sunriseDuration"] | 15;
    float bright = doc["brightness"]      | 0.8f;

    alarmDurationMs = (uint32_t)max(1, min(45, dur)) * 60UL * 1000UL;
    alarmMaxBright  = max(0.0f, min(1.0f, bright));
    alarmActive     = true;
    alarmStartMs    = millis();
    currentMode     = MODE_SUNRISE;

    // Start nearly black
    matrix.setBrightness(1);
    Serial.printf("Sunrise: %d min, max brightness %.2f\n", dur, bright);
  }
}

// =====================
// MQTT connect
// =====================
void connectMQTT() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  if (mqttClient.connected()) return;
  if (millis() - lastMqttAttempt < MQTT_RETRY_MS) return;
  lastMqttAttempt = millis();

  Serial.print(F("MQTT... "));
  if (mqttClient.connect(DEVICE_ID, MQTT_TOKEN, "")) {
    Serial.println(F("connected"));
    mqttClient.subscribe(SUB_COLOR);
    mqttClient.subscribe(SUB_SEQUENCE);
    mqttClient.subscribe(SUB_ALARM);
    mqttClient.publish(PUB_STATUS, "online");
  } else {
    Serial.print(F("fail state=")); Serial.println(mqttClient.state());
  }
}

// =====================
// Animation tick — called every loop(), not blocking
// =====================
void animationTick() {
  uint32_t now = millis();

  switch (currentMode) {

    // ── Solid ───────────────────────────────────────────────────────────
    case MODE_SOLID:
      fillMatrix(solidR, solidG, solidB);
      break;

    // ── Pulse ───────────────────────────────────────────────────────────
    // Smooth sine-wave brightness on the published color.
    case MODE_PULSE: {
      pulsePhase += 0.04f;
      if (pulsePhase > TWO_PI) pulsePhase -= TWO_PI;
      float intensity = 0.4f + 0.6f * ((sin(pulsePhase) + 1.0f) * 0.5f);
      fillMatrix(solidR*intensity, solidG*intensity, solidB*intensity);
      delay(16); // ~60fps
      break;
    }

    // ── Sequence ────────────────────────────────────────────────────────
    // Steps through the published color array, crossfading if seqFade=true.
    case MODE_SEQUENCE: {
      if (seqLen == 0) break;
      uint32_t elapsed = now - lastSeqStep;

      if (seqFade) {
        fadeFrac = (float)elapsed / (float)seqHoldMs;
        if (fadeFrac >= 1.0f) {
          fadeFrac    = 0.0f;
          lastSeqStep = now;
          seqIndex    = (seqIndex + 1) % seqLen;
        }
        int next = (seqIndex + 1) % seqLen;
        uint8_t r = lerpU8(seqColors[seqIndex].r, seqColors[next].r, fadeFrac);
        uint8_t g = lerpU8(seqColors[seqIndex].g, seqColors[next].g, fadeFrac);
        uint8_t b = lerpU8(seqColors[seqIndex].b, seqColors[next].b, fadeFrac);
        fillMatrix(r, g, b);
      } else {
        if (elapsed >= seqHoldMs) {
          lastSeqStep = now;
          seqIndex    = (seqIndex + 1) % seqLen;
        }
        fillMatrix(seqColors[seqIndex].r, seqColors[seqIndex].g, seqColors[seqIndex].b);
      }
      break;
    }

    // ── Sunrise ─────────────────────────────────────────────────────────
    // Ramps from deep red → amber → warm white over alarmDurationMs.
    // Brightness ramps simultaneously from 1 → alarmMaxBright*255.
    case MODE_SUNRISE: {
      if (!alarmActive) break;
      uint32_t elapsed = now - alarmStartMs;
      float t = min(1.0f, (float)elapsed / (float)alarmDurationMs);  // 0..1

      // Color: hue travels 0° (red) → 30° (amber) → 60° (yellow-white)
      float hue = t * 60.0f;
      // Saturation drops from 1 → 0.1 to approach white
      float sat = 1.0f - (t * 0.9f);
      // Value full the whole time; brightness handle via setBrightness
      uint8_t r, g, b;
      hsvToRgb(hue, sat, 1.0f, r, g, b);
      fillMatrix(r, g, b);

      // Ramp LED brightness
      uint8_t bVal = (uint8_t)(1 + t * (alarmMaxBright * 254));
      matrix.setBrightness(bVal);

      if (t >= 1.0f) {
        alarmActive  = false;
        currentMode  = MODE_SOLID;
        solidR = r; solidG = g; solidB = b;
        Serial.println(F("Sunrise complete"));
      }
      break;
    }

    // ── Rainbow ─────────────────────────────────────────────────────────
    // Full hue sweep across all pixels simultaneously.
    case MODE_RAINBOW: {
      static float hueOffset = 0;
      hueOffset += 1.5f;
      if (hueOffset >= 360) hueOffset = 0;
      uint8_t r, g, b;
      hsvToRgb(hueOffset, 1.0f, 1.0f, r, g, b);
      fillMatrix(r, g, b);
      delay(16);
      break;
    }

    // ── Scroll (default) ────────────────────────────────────────────────
    case MODE_SCROLL:
    default:
      if (now - lastScroll >= SCROLL_MS) {
        lastScroll = now;
        static uint16_t sc[3];
        if (sc[0] == 0) {
          sc[0] = matrix.Color(255,0,0);
          sc[1] = matrix.Color(0,255,0);
          sc[2] = matrix.Color(0,0,255);
        }
        matrix.fillScreen(0);
        matrix.setCursor(scrollX, 0);
        matrix.print(F("Howdy"));
        if (--scrollX < -72) {
          scrollX = matrix.width();
          if (++scrollPass >= 3) scrollPass = 0;
          matrix.setTextColor(sc[scrollPass]);
        }
        matrix.show();
      }
      break;
  }
}

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  matrix.begin();
  matrix.setTextWrap(false);
  matrix.setBrightness(baseBrightness);
  matrix.setTextColor(matrix.Color(255,0,0));
  scrollX = matrix.width();

  auto cfg = i2s.defaultConfig();
  cfg.pin_bck  = I2S_BCLK;
  cfg.pin_ws   = I2S_WCLK;
  cfg.pin_data = I2S_DOUT;
  i2s.begin(cfg);
  a2dp_sink.start("Sunshine");

  mqttClient.setBufferSize(1024); 

  connectWiFi();
  connectMQTT();
}

// =====================
// Loop
// =====================
void loop() {
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (mqttClient.connected() && millis() - lastHeartbeat >= HEARTBEAT_MS) {
    lastHeartbeat = millis();
    mqttClient.publish(PUB_HB, "1");
  }

  animationTick();
}