#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// =====================
// WiFi Credentials
// =====================
const char* WIFI_SSID = "Brennen";
const char* WIFI_PASSWORD = "brennenho";

// =====================
// flespi MQTT Settings
// =====================
// Host + Port
const char* MQTT_HOST = "mqtt.flespi.io";
const int   MQTT_PORT = 1883;   // non-TLS for simple testing

// flespi token = MQTT username
const char* MQTT_TOKEN = "<FILL IN>";

// Device ID (client ID)
const char* DEVICE_ID = "esp32-client";

// Topic you want to listen to
const char* SUB_TOPIC = "devices/sleepmask/color";  
// OR the topic your app uses, e.g. "devices/esp32-1/color"

WiFiClient espClient;
PubSubClient mqttClient(espClient);

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

  Serial.println();
  Serial.print("WiFi connected! IP: ");
  Serial.println(WiFi.localIP());
}

// =====================
// MQTT Callback
// =====================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("----------- NEW MQTT MESSAGE -----------");
  Serial.print("Topic: ");
  Serial.println(topic);

  Serial.print("Payload: ");
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.println(msg);
  Serial.println("----------------------------------------");
}

// =====================
// MQTT Connection
// =====================
void connectMQTT() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT... ");

    // Username = flespi token, password = empty
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
