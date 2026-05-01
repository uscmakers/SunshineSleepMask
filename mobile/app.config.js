require("dotenv").config();

module.exports = {
  expo: {
    owner: "claykoessler",
    name: "SunshineSleepMask",
    slug: "SunshineSleepMask",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "sunshinesleepmask",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.claykoessler.sunshinesleepmask",
    },
    android: {
      package: "com.claykoessler.sunshinesleepmask",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-dev-client",
      [
        "@kingstinct/react-native-healthkit",
        {
          NSHealthShareUsageDescription:
            "Sunshine Sleep Mask reads sleep and overnight heart rate from Apple Health so you can see Apple Watch sleep summaries in the app.",
          NSHealthUpdateUsageDescription:
            "Sunshine Sleep Mask does not write to Apple Health. HealthKit requires this string when enabling access.",
          background: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "c2d61aea-e297-4e81-a58b-c1e31f7658f3",
      },
      flespiToken:
        "jhIgc6MC1zVOGzhroq483pUhzXZSRhW9NfQR20OCOMf2Rgb2nmKRpzYPTszjDWCd",
      /** Matches ESP32 MQTT client id string (`mqtt.connect(DEVICE_ID, ...)`) — not used in topic paths. */
      deviceId: "esp32-client",
      /** DotStar matrix where red/green channels are wired opposite to #RRGGBB — swap R/G in MQTT payloads only. Set false for standard wiring. */
      ledSwapRedGreen: true,
      /**
       * When true, "Test Simulation" on the alarm screen runs sunrise by sending many `color` messages from the phone (sub-minute OK). No ESP reflash.
       * Set false to use on-mask sunrise via MQTT `alarm/set` (needs firmware that accepts fractional `sunriseDuration` for times under 1 min).
       */
      phoneSunriseDemo: true,
      /** Classic Bluetooth (A2DP) advertised name — matches `a2dp_sink.start(...)` in `combined.ino`. */
      bluetoothDeviceName: "Sunshine",
      spotifyClientId:
        process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ??
        "3b9de7d64cc548debac19b8a464dfa36",
    },
  },
};