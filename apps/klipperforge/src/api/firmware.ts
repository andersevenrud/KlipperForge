import type {
  BoardEntry,
  BuildResponse,
  BuildStatusResponse,
  KlipperVersionInfo,
  PresetResponse,
} from "./firmware-types";

interface SubmitBuildRequest {
  boardId: string;
  interface: string;
  options?: Record<string, string>;
  mcuOverride?: string;
}

interface BuildLogCallbacks {
  onLog: (line: string) => void;
  onStatus: (status: BuildStatusResponse) => void;
  onDone: (finalStatus: string) => void;
  onError: (error: Event) => void;
}

const BASE_URL = "/api/firmware";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchBoards(): Promise<{ boards: BoardEntry[] }> {
  return fetchJson(`${BASE_URL}/boards`);
}

export async function fetchKlipperVersion(): Promise<KlipperVersionInfo> {
  return fetchJson(`${BASE_URL}/health/klipper-version`);
}

export async function fetchBoardPresets(boardId: string, mcu?: string): Promise<PresetResponse> {
  const params = mcu ? `?mcu=${encodeURIComponent(mcu)}` : "";
  return fetchJson(`${BASE_URL}/boards/${boardId}/presets${params}`);
}

export async function submitBuild(request: SubmitBuildRequest): Promise<BuildResponse> {
  return fetchJson(`${BASE_URL}/builds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function streamBuildLogs(jobId: string, callbacks: BuildLogCallbacks): () => void {
  const source = new EventSource(`${BASE_URL}/builds/${jobId}/stream`);

  source.addEventListener("log", (e) => {
    callbacks.onLog(e.data);
  });

  source.addEventListener("status", (e) => {
    const status = JSON.parse(e.data) as BuildStatusResponse;
    status.jobId = jobId;
    callbacks.onStatus(status);
  });

  source.addEventListener("done", (e) => {
    callbacks.onDone(e.data);
    source.close();
  });

  source.onerror = (e) => {
    callbacks.onError(e);
    source.close();
  };

  return () => source.close();
}

export async function fetchBuildStatus(jobId: string): Promise<BuildStatusResponse> {
  return fetchJson(`${BASE_URL}/builds/${jobId}`);
}

export async function downloadBuild(jobId: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/builds/${jobId}/download`);
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }
  return response.blob();
}
