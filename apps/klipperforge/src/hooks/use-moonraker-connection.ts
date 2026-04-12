import { getMoonrakerErrorMessage, type MoonrakerConnectionOptions, normalizeUrl } from "@klipperforge/moonraker";
import { useCallback, useState } from "react";

interface UseMoonrakerConnectionResult {
  url: string;
  setUrl: (url: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  showApiKey: boolean;
  setShowApiKey: (show: boolean) => void;
  isConnecting: boolean;
  connectionError: string | null;
  reset: () => void;
  connect: (onConnected: (options: MoonrakerConnectionOptions) => Promise<void>) => Promise<void>;
}

const STORAGE_KEY_URL = "klipperforge:moonraker-url";
const STORAGE_KEY_API_KEY = "klipperforge:moonraker-api-key";

export function useMoonrakerConnection(): UseMoonrakerConnectionResult {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUrl(localStorage.getItem(STORAGE_KEY_URL) ?? "");
    setApiKey(localStorage.getItem(STORAGE_KEY_API_KEY) ?? "");
    setConnectionError(null);
  }, []);

  const connect = useCallback(
    async (onConnected: (options: MoonrakerConnectionOptions) => Promise<void>) => {
      const normalized = normalizeUrl(url);
      if (!normalized) return;

      setIsConnecting(true);
      setConnectionError(null);

      try {
        await onConnected({ baseUrl: normalized, apiKey: apiKey || undefined });
        localStorage.setItem(STORAGE_KEY_URL, url);
        if (apiKey) {
          localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
        } else {
          localStorage.removeItem(STORAGE_KEY_API_KEY);
        }
      } catch (err) {
        setConnectionError(getMoonrakerErrorMessage(err));
      } finally {
        setIsConnecting(false);
      }
    },
    [url, apiKey],
  );

  return {
    url,
    setUrl,
    apiKey,
    setApiKey,
    showApiKey,
    setShowApiKey,
    isConnecting,
    connectionError,
    reset,
    connect,
  };
}
