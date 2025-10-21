import React from "react";
import { ConfigProvider, App as AntdApp, theme as antdTheme } from "antd";
import {
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
  createTheme,
  responsiveFontSizes,
  type PaletteMode,
} from "@mui/material";
import { themeTokens } from "./tokens";
import { responsiveThemeOptions } from "./responsive";

const STORAGE_KEY = "sma-admin-theme-mode";

type ColorMode = Extract<PaletteMode, "light" | "dark">;

type ThemeContextValue = {
  mode: ColorMode;
  toggleMode: () => void;
  setMode: (mode: ColorMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const resolveInitialMode = (): ColorMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const persisted = window.localStorage.getItem(STORAGE_KEY);
  if (persisted === "light" || persisted === "dark") {
    return persisted;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = React.useState<ColorMode>(() => resolveInitialMode());

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const muiTheme = React.useMemo(() => {
    const baseTheme = createTheme(responsiveThemeOptions(mode));
    const theme = createTheme(baseTheme, {
      palette: {
        primary: {
          main: themeTokens.primary,
        },
        secondary: {
          main: mode === "dark" ? "#38bdf8" : "#0ea5e9",
        },
        success: {
          main: themeTokens.accentGreen,
        },
        warning: {
          main: themeTokens.accentOrange,
        },
        background: {
          default: mode === "dark" ? "#0f172a" : "#f8fafc",
          paper: mode === "dark" ? "#111827" : "#ffffff",
        },
        text: {
          primary: mode === "dark" ? "#e2e8f0" : "#0f172a",
          secondary:
            mode === "dark" ? themeTokens.secondaryTextDark : themeTokens.secondaryTextLight,
        },
      },
      typography: {
        h5: {
          fontWeight: 600,
          letterSpacing: -0.2,
        },
        subtitle2: {
          color: mode === "dark" ? themeTokens.secondaryTextDark : themeTokens.secondaryTextLight,
        },
      },
      shape: {
        borderRadius: 16,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 12,
              boxShadow: "none",
              "&:focus-visible": {
                boxShadow: themeTokens.focusRing,
                outline: "none",
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              "&:focus-visible": {
                boxShadow: themeTokens.focusRing,
                outline: "none",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: themeTokens.cardBorderRadius,
              boxShadow:
                mode === "dark" ? "0 12px 40px rgba(15, 23, 42, 0.45)" : themeTokens.cardShadow,
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              "&.Mui-focusVisible": {
                boxShadow: themeTokens.focusRing,
              },
            },
          },
        },
      },
    });

    return responsiveFontSizes(theme);
  }, [mode]);

  const antdConfig = React.useMemo(
    () => ({
      algorithm: [mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm],
      token: {
        colorPrimary: themeTokens.primary,
        colorInfo: themeTokens.primary,
        controlHeight: 44,
        borderRadius: 12,
        colorTextSecondary:
          mode === "dark" ? themeTokens.secondaryTextDark : themeTokens.secondaryTextLight,
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      },
    }),
    [mode]
  );

  const value = React.useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
      setMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdConfig}>
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline enableColorScheme />
          <AntdApp>{children}</AntdApp>
        </MuiThemeProvider>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useColorMode = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useColorMode must be used within ThemeProvider");
  }
  return context;
};
