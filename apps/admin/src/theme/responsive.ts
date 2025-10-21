import { ThemeOptions } from "@mui/material";

export const responsiveThemeOptions = (mode: "light" | "dark"): ThemeOptions => ({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "clamp(18px, 3.2vw, 28px)",
    },
    h2: {
      fontWeight: 700,
      fontSize: "clamp(16px, 2.6vw, 22px)",
    },
    body1: {
      fontSize: "clamp(13px, 1.9vw, 16px)",
    },
    body2: {
      fontSize: "clamp(12px, 1.7vw, 15px)",
    },
    button: {
      fontWeight: 600,
    },
  },
  spacing: 4,
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: "xl",
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          paddingBlock: 8,
          paddingInline: 16,
        },
      },
    },
  },
  palette: {
    mode,
  },
});
