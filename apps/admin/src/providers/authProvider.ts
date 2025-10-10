import type { AuthProvider } from "@refinedev/core";

const sanitizeBaseUrl = (rawUrl?: string) => {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return "http://localhost:3000/api/v1";
  }

  return rawUrl.replace(/\/+$/, "");
};

const API_URL = sanitizeBaseUrl(import.meta.env.VITE_API_URL);

const resolveEndpoint = (path: string) => `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

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
  data?: TokenResponse;
  result?: TokenResponse;
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
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");
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

const unwrapTokenPayload = (payload: TokenResponse | null | undefined): TokenResponse | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.data && typeof payload.data === "object") {
    return unwrapTokenPayload(payload.data);
  }

  if (payload.result && typeof payload.result === "object") {
    return unwrapTokenPayload(payload.result);
  }

  return payload;
};

const normalizeTokens = (tokens: TokenResponse | null | undefined) => {
  const payload = unwrapTokenPayload(tokens);
  if (!payload) {
    return null;
  }

  const accessToken = payload.accessToken ?? payload.access_token;
  const refreshToken = payload.refreshToken ?? payload.refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }: LoginParams) => {
    try {
      const response = await fetch(resolveEndpoint("auth/login"), {
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
      const normalizedTokens = normalizeTokens(body ?? null);

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
        const meResponse = await fetch(resolveEndpoint("auth/me"), {
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
    } catch {
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
        await fetch(resolveEndpoint("auth/logout"), {
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

    console.info("[auth] checkAuth", {
      hasToken: Boolean(token),
      tokenPreview: token ? `${token.slice(0, 8)}…` : undefined,
    });

    if (!token) {
      console.warn("[auth] checkAuth", "No access token found. Redirecting to login.");
      return { authenticated: false, redirectTo: "/login", logout: true };
    }

    // Optionally verify token with backend
    try {
      const response = await fetch(resolveEndpoint("auth/me"), {
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

    const token = getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(resolveEndpoint("auth/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return null;
      }

      const user = (await response.json()) as MeResponse;
      localStorage.setItem("user", JSON.stringify(user));

      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatar: undefined,
      };
    } catch (error) {
      console.error("[auth] getIdentity", "Failed to fetch identity", error);
      return null;
    }
  },

  onError: async (error) => {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      clearTokens();
      return { logout: true, redirectTo: "/login", error };
    }
    return { error };
  },
};
