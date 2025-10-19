export const themeTokens = {
  primary: "#2f6fed",
  accentBlue: "#2563eb",
  accentGreen: "#16a34a",
  accentOrange: "#f97316",
  secondaryTextLight: "#6b7280",
  secondaryTextDark: "#94a3b8",
  cardShadow: "0 18px 32px rgba(15, 23, 42, 0.08)",
  cardBorderRadius: 20,
  focusRing: "0 0 0 3px rgba(47, 111, 237, 0.35)",
} as const;

export type ThemeTokens = typeof themeTokens;
