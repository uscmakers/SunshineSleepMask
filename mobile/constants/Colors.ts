const tintColorLight = "#2f95dc";
/** Tab / header accent in dark mode (matches in-app teal). */
const tintColorDark = "#00d5be";

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#888",
    tabIconSelected: tintColorDark,
  },
};
