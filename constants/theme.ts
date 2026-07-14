export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
  chartBar: string;
  chartBarFaded: string;
}

export const THEMES: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: "#F7F5FB",
    surface: "#FFFFFF",
    surfaceAlt: "#F1EBFD",
    text: "#1A1523",
    textSecondary: "#6B6580",
    textMuted: "#9B95B0",
    border: "#E9E5F3",
    primary: "#7C3AED",
    primarySoft: "#F1EBFD",
    onPrimary: "#FFFFFF",
    success: "#0E9F6E",
    danger: "#E02424",
    warning: "#C27803",
    overlay: "rgba(26, 21, 35, 0.5)",
    chartBar: "#7C3AED",
    chartBarFaded: "#DDD1F8",
  },
  dark: {
    bg: "#14121F",
    surface: "#1E1B2E",
    surfaceAlt: "#2A2342",
    text: "#F4F2FA",
    textSecondary: "#A29DB8",
    textMuted: "#6E6887",
    border: "#2E2A40",
    primary: "#9775FA",
    primarySoft: "#2A2342",
    onPrimary: "#14121F",
    success: "#31C48D",
    danger: "#F98080",
    warning: "#E3A008",
    overlay: "rgba(0, 0, 0, 0.6)",
    chartBar: "#9775FA",
    chartBarFaded: "#3A3155",
  },
};

export const CURRENCIES = ["$", "₱", "€", "£", "¥"] as const;
