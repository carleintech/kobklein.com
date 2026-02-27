/**
 * KobKlein — Sovereign Luxury Design System (React Native)
 *
 * Direct mapping from the Tailwind v4 `@theme inline` values
 * used in apps/web and apps/web-public.
 */

export const colors = {
  // Backgrounds
  black: "#080B14",
  navy: "#0F1626",
  panel: "#151B2E",

  // Gold spectrum
  gold: "#C6A756",
  goldLight: "#E1C97A",
  goldDark: "#9F7F2C",

  // Status
  // emerald: "#1F6F4A", // Removed for diaspora theme
  danger: "#DC2626",
  warning: "#F59E0B",

  // Text
  textHeading: "#F2F2F2",
  textBody: "#C4C7CF",
  textMuted: "#7A8394",

  // Borders / overlays
  border: "rgba(255, 255, 255, 0.04)",
  borderLight: "rgba(255, 255, 255, 0.08)",
  borderGold: "rgba(198, 167, 86, 0.20)",
  overlay: "rgba(0, 0, 0, 0.60)",

  // Misc
  white: "#FFFFFF",
  transparent: "transparent",
} as const;

export const fonts = {
  serif: "PlayfairDisplay_700Bold",
  serifMedium: "PlayfairDisplay_600SemiBold",
  serifRegular: "PlayfairDisplay_400Regular",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  sansLight: "Inter_300Light",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  gold: {
    shadowColor: "#C6A756",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

export type ThemeColors = typeof colors;
export type ThemeFonts = typeof fonts;
