import type {
  AuthMeResponse,
  ConfigDetailResponse,
  ConfigListResponse,
  CreateConfigResponse,
  CreateShareResponse,
  RevisionDetailResponse,
  RevisionListResponse,
  SharedConfigResponse,
  ShareListResponse,
  UpdateConfigResponse,
} from "./config-storage-types";

const BASE_URL = "/api/configs";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// Auth

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return fetchJson("/api/auth/me");
}

export async function logout(): Promise<void> {
  await fetchJson("/api/auth/logout", { method: "POST" });
}

// Configs

export async function fetchConfigList(): Promise<ConfigListResponse> {
  return fetchJson(BASE_URL);
}

export async function fetchConfig(id: string): Promise<ConfigDetailResponse> {
  return fetchJson(`${BASE_URL}/${id}`);
}

export async function createConfig(name: string, document: string, comment?: string): Promise<CreateConfigResponse> {
  return fetchJson(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, document, comment }),
  });
}

export async function updateConfigRevision(
  id: string,
  document: string,
  comment?: string,
): Promise<UpdateConfigResponse> {
  return fetchJson(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document, comment }),
  });
}

export async function deleteConfig(id: string): Promise<void> {
  await fetchJson(`${BASE_URL}/${id}`, { method: "DELETE" });
}

// Revisions

export async function fetchRevisionList(configId: string): Promise<RevisionListResponse> {
  return fetchJson(`${BASE_URL}/${configId}/revisions`);
}

export async function fetchRevision(configId: string, revisionNumber: number): Promise<RevisionDetailResponse> {
  return fetchJson(`${BASE_URL}/${configId}/revisions/${revisionNumber}`);
}

// Shares

export async function createShare(configId: string): Promise<CreateShareResponse> {
  return fetchJson(`${BASE_URL}/${configId}/share`, { method: "POST" });
}

export async function fetchShareList(configId: string): Promise<ShareListResponse> {
  return fetchJson(`${BASE_URL}/${configId}/shares`);
}

export async function deleteShare(configId: string, shareId: string): Promise<void> {
  await fetchJson(`${BASE_URL}/${configId}/shares/${shareId}`, { method: "DELETE" });
}

export async function renameConfig(id: string, name: string): Promise<void> {
  await fetchJson(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function fetchSharedConfig(shareToken: string): Promise<SharedConfigResponse> {
  return fetchJson(`/api/shared/${shareToken}`);
}

export async function fetchSharedRevisionList(shareToken: string): Promise<RevisionListResponse> {
  return fetchJson(`/api/shared/${shareToken}/revisions`);
}

export async function fetchSharedRevision(shareToken: string, revisionNumber: number): Promise<RevisionDetailResponse> {
  return fetchJson(`/api/shared/${shareToken}/revisions/${revisionNumber}`);
}
