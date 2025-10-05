import type { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

// Helper to get tokens from localStorage
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }: LoginParams) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      const data: AuthResponse = await response.json();

      // Store tokens and user info
      setTokens(data.access_token, data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return {
        success: true,
        redirectTo: "/",
      };
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

    if (!token) {
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    }

    // Optionally verify token with backend
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        clearTokens();
        return {
          authenticated: false,
          redirectTo: "/login",
          logout: true,
        };
      }

      return {
        authenticated: true,
      };
    } catch (error) {
      // If /auth/me doesn't exist, just check token presence
      return {
        authenticated: true,
      };
    }
  },

  getPermissions: async () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role;
    }
    return null;
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
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
      return {
        logout: true,
        redirectTo: "/login",
        error,
      };
    }

    return { error };
  },
};
