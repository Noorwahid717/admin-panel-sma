import type { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface LoginParams {
  email: string;
  password: string;
}

type TokenResponse = {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  expires_in?: number;
  refresh_expires_in?: number;
  tokenType?: "Bearer";
  token_type?: string;
  user?: MeResponse;
};

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  teacherId?: string | null;
  studentId?: string | null;
}

// Helper to get tokens from localStorage
const getAccessToken = () =>
  localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");
const getRefreshToken = () =>
  localStorage.getItem("refresh_token") ?? localStorage.getItem("refreshToken");
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  // Legacy camelCase keys for backward compatibility with earlier builds
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const normalizeTokens = (tokens: TokenResponse) => {
  const accessToken = tokens.accessToken ?? tokens.access_token;
  const refreshToken = tokens.refreshToken ?? tokens.refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }: LoginParams) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            name: "LoginError",
            message: error.message || "Invalid email or password",
          },
        };
      }

      const body: TokenResponse = await response.json();
      const normalizedTokens = normalizeTokens(body);

      if (!normalizedTokens) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Authentication response did not include access tokens.",
          },
        };
      }

      const { accessToken, refreshToken } = normalizedTokens;

      // Store tokens first
      setTokens(accessToken, refreshToken);

      // If backend already returned user, store it. Otherwise try fetching /auth/me
      if (body.user) {
        localStorage.setItem("user", JSON.stringify(body.user));
      }

      try {
        const meResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (meResponse.ok) {
          const user: MeResponse = await meResponse.json();
          localStorage.setItem("user", JSON.stringify(user));
        } else if (!body.user) {
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Failed to fetch user profile after login", error);
        if (!body.user) {
          localStorage.removeItem("user");
        }
      }

      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Network error. Please check your connection.",
        },
      };
    }
  },

  logout: async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken && refreshToken) {
      try {
        // Call logout endpoint to invalidate tokens
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error("Logout API call failed:", error);
      }
    }

    clearTokens();
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const token = getAccessToken();

    console.info("[auth] checkAuth", { hasToken: Boolean(token) });

    if (!token) {
      console.warn("[auth] checkAuth", "No access token found. Redirecting to login.");
      return { authenticated: false, redirectTo: "/login", logout: true };
    }

    // Optionally verify token with backend
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.info("[auth] checkAuth", "/auth/me response", response.status);

      if (!response.ok) {
        console.warn("[auth] checkAuth", "Backend rejected token. Clearing session.");
        clearTokens();
        return { authenticated: false, redirectTo: "/login", logout: true };
      }

      return { authenticated: true };
    } catch (error) {
      console.error("[auth] checkAuth", "Network error during /auth/me", error);
      // If /auth/me doesn't exist, just check token presence
      return { authenticated: true };
    }
  },

  getPermissions: async () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr) as MeResponse;
      return user.role;
    }
    return null;
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr) as MeResponse;
      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatar: undefined,
      };
    }
    return null;
  },

  onError: async (error) => {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      clearTokens();
      return { logout: true, redirectTo: "/login", error };
    }
    return { error };
  },
};
