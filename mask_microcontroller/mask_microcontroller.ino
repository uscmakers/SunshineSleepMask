#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_NeoPixel.h>

// =====================
// LED STRIPS
// =====================
#define LED_PIN_1  4   // D2
#define LED_PIN_2  0   // D3
#define NUM_LEDS_1 30
#define NUM_LEDS_2 30

Adafruit_NeoPixel strip1(NUM_LEDS_1, LED_PIN_1, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip2(NUM_LEDS_2, LED_PIN_2, NEO_GRB + NEO_KHZ800);

// =====================
// WiFi Credentials
// =====================
const char* WIFI_SSID = "Brennen";
const char* WIFI_PASSWORD = "brennenho";

// =====================
// flespi MQTT Settings
// =====================
const char* MQTT_HOST = "mqtt.flespi.io";
const int   MQTT_PORT = 1883;

const char* MQTT_TOKEN = "zMUoSoYnkdqAQ3ISp8nJCtRmPlYbouGeaYR4R6Kl3ge8MhNlUJWq9mycqx0qQqiD";
const char* DEVICE_ID = "esp8266-client";
const char* SUB_TOPIC = "devices/sleepmask/color";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ======================================================
// Convert HEX string (“#RRGGBB”) → r,g,b (0–255)
// ======================================================
void hexToRGB(String hex, uint8_t &r, uint8_t &g, uint8_t &b) {
  hex.trim();
  hex.replace("#", "");

  if (hex.length() != 6) {
    Serial.println("hexToRGB: invalid hex length, defaulting to 0,0,0");
    r = g = b = 0;
    return;
  }

  r = strtoul(hex.substring(0, 2).c_str(), NULL, 16);
  g = strtoul(hex.substring(2, 4).c_str(), NULL, 16);
  b = strtoul(hex.substring(4, 6).c_str(), NULL, 16);
}

// ======================================================
// Apply color to both LED strips
// ======================================================
void setColorAll(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS_1; i++) {
    strip1.setPixelColor(i, strip1.Color(r, g, b));
  }
  for (int i = 0; i < NUM_LEDS_2; i++) {
    strip2.setPixelColor(i, strip2.Color(r, g, b));
  }

  strip1.show();
  strip2.show();
}

// ======================================================
// MQTT CALLBACK – when message arrives
// ======================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("----------- NEW MQTT MESSAGE -----------");
  Serial.print("Topic: "); 
  Serial.println(topic);

  // Convert payload to String
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  Serial.print("Payload: ");
  Serial.println(msg);

  // Extract the hex color inside {"color":"#xxxxxx"}
  int hashIndex = msg.indexOf('#');
  if (hashIndex == -1 || hashIndex + 7 > msg.length()) {
    Serial.println("No valid hex color found in payload");
    return;
  }

  String hex = msg.substring(hashIndex, hashIndex + 7);  
  Serial.print("Extracted HEX: ");
  Serial.println(hex);

  uint8_t r, g, b;
  hexToRGB(hex, r, g, b);

  Serial.printf("Parsed RGB = %d, %d, %d\n", r, g, b);

  setColorAll(r, g, b);
}

// =====================
// WiFi Connection
// =====================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// =====================
// MQTT Connection
// =====================
void connectMQTT() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT... ");

    bool connected = mqttClient.connect(DEVICE_ID, MQTT_TOKEN, "");

    if (connected) {
      Serial.println("connected!");
      mqttClient.subscribe(SUB_TOPIC);
      Serial.print("Subscribed to topic: ");
      Serial.println(SUB_TOPIC);
    } else {
      Serial.print("failed, state=");
      Serial.print(mqttClient.state());
      Serial.println(" — retrying in 3 seconds");
      delay(3000);
    }
  }
}

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  delay(500);

  strip1.begin();
  strip2.begin();
  strip1.show();
  strip2.show();

  connectWiFi();
  connectMQTT();
}

// =====================
// Loop
// =====================
void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();
}
