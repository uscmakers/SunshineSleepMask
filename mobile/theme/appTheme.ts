/**
 * Tokens aligned to Figma file `1UQUWwQltKn4qCp7vTtfPs` (HomePage node 1:5, tab bar 1:301).
 * Load Inter via `@expo-google-fonts/inter` in `app/_layout.tsx`.
 */
export const fonts = {
  light: "Inter_300Light",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
} as const;

export const appTheme = {
  fonts,
  colors: {
    background: "#000000",
    /** Primary card surface */
    surface: "#171717",
    /** Inner rows / battery pill */
    surfaceRow: "#262626",
    surfaceElevated: "#262626",
    border: "#262626",
    borderInner: "#404040",
    text: "#ffffff",
    textSecondary: "#a1a1a1",
    textMuted: "#737373",
    textDim: "#737373",
    textInsightBody: "#d4d4d4",
    /** Tab active label, highlights (Figma `#00d5be`) */
    accent: "#00d5be",
    /** Selected chip / day-pill backgrounds (not in Figma v1 export; teal tint) */
    accentSurface: "rgba(0, 213, 190, 0.14)",
    accentMuted: "#5eead4",
    /** Icon wells / subtle fills (Figma `rgba(0,187,167,0.1)`) */
    accentTint: "rgba(0, 187, 167, 0.1)",
    accentBorderSoft: "rgba(0, 187, 167, 0.2)",
    /** Mask “eye” glow reds from design */
    accentEyeOuter: "#fb2c36",
    accentEyeInner: "#e7000b",
    warningBg: "#3a2a10",
    warningBorder: "#8a6a20",
    warningText: "#f5d78e",
    overlay: "rgba(0,0,0,0.8)",
    tabBarBg: "rgba(23, 23, 23, 0.94)",
  },
  radii: {
    sm: 8,
    md: 10,
    lg: 14,
    xl: 16,
    pill: 20,
    full: 9999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    /** Major vertical gap between home cards (Figma ~23.993) */
    sectionGap: 24,
    cardPadding: 20,
  },
  type: {
    /** Heading 1 */
    heroTitle: 30,
    heroTitleLine: 36,
    subtitle: 16,
    subtitleLine: 24,
    /** Section / card titles */
    h3: 18,
    h3Line: 27,
    /** Row titles in settings list */
    rowTitle: 16,
    rowTitleLine: 24,
    body: 14,
    bodyLine: 20,
    caption: 12,
    captionLine: 16,
    /** Metric large values */
    metricLg: 30,
    metricLgLine: 36,
    metricMd: 24,
    metricMdLine: 32,
    /** Secondary screen titles (Alarm / Sounds / Data tabs) */
    screenTitle: 24,
    screenTitleLine: 28,
    /** In-screen section headings */
    section: 18,
    sectionLine: 27,
    /** Legacy large title */
    title: 26,
    titleLine: 32,
    /** Fine print */
    label: 13,
    labelLine: 18,
  },
} as const;

export type AppTheme = typeof appTheme;
