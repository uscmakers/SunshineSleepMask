/**
 * Sleep mask controller — ESP32, WiFi + MQTT (Flespi), dual Adafruit DotStar strips.
 * Requires: PubSubClient, ArduinoJson, Adafruit_DotStar, SPI, WiFi (ESP32)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_DotStar.h>
#include <SPI.h>
#include <cstdlib>
#include <cstring>

#include "secrets.h"

// ===================== LED STRIPS (DotStar) =====================
#define DATA_PIN_1   4
#define CLOCK_PIN_1  2
#define NUM_LEDS_1   30

#define DATA_PIN_2   0
#define CLOCK_PIN_2  15
#define NUM_LEDS_2   30

Adafruit_DotStar strip1(NUM_LEDS_1, DATA_PIN_1, CLOCK_PIN_1, DOTSTAR_BGR);
Adafruit_DotStar strip2(NUM_LEDS_2, DATA_PIN_2, CLOCK_PIN_2, DOTSTAR_BGR);

// ===================== MQTT topics =====================
static const char TOPIC_COLOR[]  = "devices/sleepmask/color";
static const char TOPIC_AUDIO[]  = "devices/sleepmask/audio/set";
static const char TOPIC_ALARM[]  = "devices/sleepmask/alarm/set";
static const char TOPIC_HEART[]  = "devices/sleepmask/heartbeat";
static const char TOPIC_STATUS[] = "devices/sleepmask/status";
static const char TOPIC_ACK[]    = "devices/sleepmask/ack";

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// --------------------- Timing (non-blocking retries) ---------------------
static const unsigned long WIFI_RETRY_MS  = 5000;
static const unsigned long MQTT_RETRY_MS  = 5000;
static const unsigned long HEARTBEAT_MS     = 5000;
static const size_t        MQTT_BUF_SIZE  = 1024;
static const size_t        JSON_DOC_SIZE  = 512;

static unsigned long lastWifiAttempt  = 0;
static unsigned long lastMqttAttempt  = 0;
static unsigned long lastHeartbeat   = 0;
static bool          wasWifiUp       = false;

// --------------------- State (for LED + status) ---------------------------
static uint8_t g_r = 0, g_g = 0, g_b = 0;  // last commanded RGB (0–255)
static float   g_brightness = 1.0f;         // 0.0 – 1.0

// =====================================================
void hexToRGB(const char* hexIn, uint8_t& r, uint8_t& g, uint8_t& b);
void setColorAll(uint8_t r, uint8_t gr, uint8_t b, float brightness);
void connectWiFi(void);
void reconnectWiFi(void);
void connectMQTT(void);
void reconnectMQTT(void);
void initMqttClient(void);
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handleMessage(const char* topic, const char* jsonBuf, size_t jsonLen);
void publishAck(const char* type, bool success, const char* errMsg = nullptr);
void publishStatus(void);
void publishHeartbeat(void);
bool copyPayloadToBuffer(byte* payload, unsigned int length, char* out, size_t outSize);

// =====================================================
// HEX "#RRGGBB" (or "RRGGBB") -> r, g, b
// =====================================================
void hexToRGB(const char* hexIn, uint8_t& r, uint8_t& g, uint8_t& b) {
  if (!hexIn) {
    r = g = b = 0;
    return;
  }
  // Skip # if present; expect 6 hex digits
  const char* p = hexIn;
  if (p[0] == '#') p++;

  if (strlen(p) != 6) {
    Serial.println("hexToRGB: need 6 hex digits");
    r = g = b = 0;
    return;
  }
  char tmp[3] = {0, 0, 0};
  tmp[0] = p[0];
  tmp[1] = p[1];
  r = (uint8_t)strtoul(tmp, nullptr, 16);
  tmp[0] = p[2];
  tmp[1] = p[3];
  g = (uint8_t)strtoul(tmp, nullptr, 16);
  tmp[0] = p[4];
  tmp[1] = p[5];
  b = (uint8_t)strtoul(tmp, nullptr, 16);
}

// =====================================================
// Apply color to both strips; brightness scales 0..1
// =====================================================
void setColorAll(uint8_t r, uint8_t gr, uint8_t b, float brightness) {
  if (brightness < 0.0f) brightness = 0.0f;
  if (brightness > 1.0f) brightness = 1.0f;

  uint8_t rr = (uint8_t)((float)r * brightness + 0.5f);
  uint8_t gg = (uint8_t)((float)gr * brightness + 0.5f);
  uint8_t bb = (uint8_t)((float)b * brightness + 0.5f);

  for (int i = 0; i < NUM_LEDS_1; i++) {
    strip1.setPixelColor(i, rr, gg, bb);
  }
  for (int i = 0; i < NUM_LEDS_2; i++) {
    strip2.setPixelColor(i, rr, gg, bb);
  }
  strip1.show();
  strip2.show();
}

// =====================================================
void initMqttClient(void) {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(MQTT_BUF_SIZE);
  mqttClient.setCallback(mqttCallback);
  Serial.print("MQTT broker ");
  Serial.print(MQTT_HOST);
  Serial.print(":");
  Serial.println(MQTT_PORT);
}

// -------- WiFi: initial connect (non-blocking) ------
void connectWiFi(void) {
  Serial.print("WiFi connect to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttempt = millis();
}

// -------- WiFi: maintenance --------------------------------
void reconnectWiFi(void) {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  unsigned long now = millis();
  if (now - lastWifiAttempt < WIFI_RETRY_MS) {
    return;
  }
  lastWifiAttempt = now;
  Serial.println("[WiFi] lost, reconnecting...");
  WiFi.disconnect();
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// -------- MQTT: single connect + subscribe (requires WiFi) ------
void connectMQTT(void) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  if (mqttClient.connected()) {
    return;
  }

  Serial.print("[MQTT] connecting as ");
  Serial.print(MQTT_CLIENT_ID);
  Serial.print(" ... ");
  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_TOKEN, "")) {
    Serial.println("connected");
    mqttClient.subscribe(TOPIC_COLOR);
    mqttClient.subscribe(TOPIC_AUDIO);
    mqttClient.subscribe(TOPIC_ALARM);
    Serial.println("[MQTT] subscribed: color, audio/set, alarm/set");
    publishStatus();
  } else {
    Serial.print("failed, rc=");
    Serial.println(mqttClient.state());
  }
}

// -------- MQTT: throttled retry --------------------------------
void reconnectMQTT(void) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  if (mqttClient.connected()) {
    return;
  }
  unsigned long now = millis();
  if (now - lastMqttAttempt < MQTT_RETRY_MS) {
    return;
  }
  lastMqttAttempt = now;
  connectMQTT();
}

// =====================================================
void publishAck(const char* type, bool success, const char* errMsg) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["type"] = type;
  doc["success"] = success;
  if (errMsg) {
    doc["error"] = errMsg;
  }
  char buf[256];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  if (n < sizeof(buf) && mqttClient.publish(TOPIC_ACK, buf)) {
      Serial.print("[ACK] ");
      Serial.println(buf);
    } else {
      Serial.println("[ACK] publish failed (buffer too small or MQTT fault)");
    }
  }
}

void publishStatus(void) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<384> doc;
  char hex[10];
  snprintf(hex, sizeof(hex), "#%02X%02X%02X", g_r, g_g, g_b);
  doc["color"] = hex;
  doc["brightness"] = g_brightness;
  doc["wifi"] =
      (WiFi.status() == WL_CONNECTED) ? "connected" : "disconnected";
  doc["mqtt"] = mqttClient.connected() ? "connected" : "disconnected";

  char buf[384];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  if (n < sizeof(buf) && mqttClient.publish(TOPIC_STATUS, buf)) {
    Serial.print("[STATUS] ");
    Serial.println(buf);
  } else {
    Serial.println("[STATUS] publish failed");
  }
}

void publishHeartbeat(void) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["status"]   = "online";
  int rssi = (WiFi.status() == WL_CONNECTED) ? WiFi.RSSI() : 0;
  doc["rssi"]     = rssi;
  doc["uptime"]   = (unsigned long)(millis() / 1000UL);

  char buf[256];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  if (n < sizeof(buf) && mqttClient.publish(TOPIC_HEART, buf)) {
    Serial.print("[HEART] ");
    Serial.println(buf);
  } else {
    Serial.println("[HEART] publish failed");
  }
}

// =====================================================
bool copyPayloadToBuffer(byte* payload, unsigned int length, char* out, size_t outSize) {
  if (!out || outSize < 2) {
    return false;
  }
  if (length >= outSize) {
    Serial.print("[MSG] payload too long: ");
    Serial.println(length);
    return false;
  }
  memcpy(out, payload, length);
  out[length] = '\0';
  return true;
}

// Parse {"color":"#FFAA00","brightness":0.5}
void handleMessage(const char* topic, const char* jsonBuf, size_t jsonLen) {
  (void)jsonLen;  // buffer is null-terminated in mqttCallback; length available if needed
  Serial.print("[MSG] topic=");
  Serial.println(topic);

  if (strcmp(topic, TOPIC_COLOR) == 0) {
    StaticJsonDocument<JSON_DOC_SIZE> doc;
    DeserializationError err = deserializeJson(doc, jsonBuf);
    if (err) {
      Serial.print("JSON error: ");
      Serial.println(err.c_str());
      publishAck("color", false, "invalid_json");
      return;
    }
    if (doc["color"].isNull()) {
      publishAck("color", false, "missing_color");
      return;
    }
    const char* cstr = doc["color"].as<const char*>();
    if (cstr == nullptr || cstr[0] == '\0') {
      publishAck("color", false, "empty_color");
      return;
    }

    float bright = 1.0f;
    if (!doc["brightness"].isNull()) {
      bright = (float)doc["brightness"].as<double>();
      if (bright < 0.0f) bright = 0.0f;
      if (bright > 1.0f) bright = 1.0f;
    }

    uint8_t rr, gg, bb;
    hexToRGB(cstr, rr, gg, bb);
    g_r          = rr;
    g_g          = gg;
    g_b          = bb;
    g_brightness = bright;
    setColorAll(g_r, g_g, g_b, g_brightness);
    publishAck("color", true, nullptr);
    publishStatus();
    return;
  }

  if (strcmp(topic, TOPIC_AUDIO) == 0) {
    Serial.println("[AUDIO] payload received; playback not implemented (reserved)");
    publishAck("audio", false, "not_implemented");
    return;
  }

  if (strcmp(topic, TOPIC_ALARM) == 0) {
    Serial.println("[ALARM] payload received; handler not implemented (reserved)");
    publishAck("alarm", false, "not_implemented");
    return;
  }

  Serial.print("[MSG] unhandled topic: ");
  Serial.println(topic);
}

// =====================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char  buf[512];
  char* jsonBuf = buf;
  if (!copyPayloadToBuffer(payload, length, jsonBuf, sizeof(buf))) {
    return;
  }
  Serial.print("[IN] topic=");
  Serial.print(topic);
  Serial.print(" payload=");
  Serial.println(jsonBuf);
  handleMessage(topic, jsonBuf, length);
}

// ===================== setup / loop =====================
void setup() {
  Serial.begin(115200);
  delay(200);
  lastHeartbeat = millis();

  strip1.begin();
  strip2.begin();
  strip1.show();
  strip2.show();

  initMqttClient();
  connectWiFi();
}

void loop() {
  reconnectWiFi();

  bool w = (WiFi.status() == WL_CONNECTED);
  if (w && !wasWifiUp) {
    // WiFi just came up — allow immediate MQTT try
    wasWifiUp     = true;
    lastMqttAttempt = 0;
  } else if (!w) {
    wasWifiUp = false;
  }

  if (w) {
    reconnectMQTT();
  }

  if (mqttClient.connected()) {
    mqttClient.loop();
  }

  if (w && mqttClient.connected()) {
    if (millis() - lastHeartbeat >= HEARTBEAT_MS) {
      lastHeartbeat = millis();
      publishHeartbeat();
    }
  }

  delay(5);
}
