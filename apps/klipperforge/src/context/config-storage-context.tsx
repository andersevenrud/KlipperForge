import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { ConfigStorageAdapter } from "@/api/config-storage-adapter";
import { createLocalStorageAdapter } from "@/api/local-storage-adapter";
import { createRemoteStorageAdapter } from "@/api/remote-storage-adapter";
import { useAuth } from "./auth-context";

interface ConfigStorageContextValue {
  adapter: ConfigStorageAdapter;
  mode: "local" | "remote";
}

const ConfigStorageContext = createContext<ConfigStorageContextValue | null>(null);

interface ConfigStorageProviderProps {
  children: ReactNode;
}

export function ConfigStorageProvider({ children }: ConfigStorageProviderProps) {
  const { user } = useAuth();

  const value = useMemo<ConfigStorageContextValue>(() => {
    if (user) {
      const adapter = createRemoteStorageAdapter();
      return { adapter, mode: "remote" };
    }
    const adapter = createLocalStorageAdapter();
    return { adapter, mode: "local" };
  }, [user]);

  return <ConfigStorageContext.Provider value={value}>{children}</ConfigStorageContext.Provider>;
}

export function useConfigStorage(): ConfigStorageContextValue {
  const context = useContext(ConfigStorageContext);
  if (!context) {
    throw new Error("useConfigStorage must be used within a ConfigStorageProvider");
  }
  return context;
}
