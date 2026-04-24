require("dotenv").config();

module.exports = {
  expo: {
    name: "SunshineSleepMask",
    slug: "SunshineSleepMask",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "sunshinesleepmask",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
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
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      flespiToken: "jhIgc6MC1zVOGzhroq483pUhzXZSRhW9NfQR20OCOMf2Rgb2nmKRpzYPTszjDWCd",
      deviceId: "esp8266-client",
    },
  },
};
