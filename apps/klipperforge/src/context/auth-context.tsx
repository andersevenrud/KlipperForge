import type { AuthUser } from "@/api/config-storage-types";
import { fetchAuthMe, logout as logoutApi } from "@/api/configs";
import { featureFlags } from "@/lib/feature-flags";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  useEffect(function fetchSessionEffect() {
    if (!featureFlags.configStorage) {
      setState({ user: null, isLoading: false });
      return;
    }

    async function checkSession() {
      try {
        const response = await fetchAuthMe();
        setState({ user: response.user, isLoading: false });
      } catch {
        setState({ user: null, isLoading: false });
      }
    }

    checkSession();
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/auth/github";
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setState({ user: null, isLoading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, isLoading: state.isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
