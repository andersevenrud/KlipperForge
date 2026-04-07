export interface MoonrakerFileEntry {
  path: string;
  modified: number;
  size: number;
}

export interface MoonrakerConnectionOptions {
  baseUrl: string;
  apiKey?: string;
}

interface MoonrakerListResult {
  result: MoonrakerFileEntry[];
}

function buildHeaders(options: MoonrakerConnectionOptions): HeadersInit {
  const headers: Record<string, string> = {};
  if (options.apiKey) {
    headers["X-Api-Key"] = options.apiKey;
  }
  return headers;
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized) return normalized;

  // Default to http:// if no protocol
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }

  // Strip trailing slash
  normalized = normalized.replace(/\/+$/, "");

  return normalized;
}

export function getMoonrakerErrorMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return (
      "Could not connect to Moonraker. Check that the URL is correct, the printer is online, " +
      "and that your Moonraker configuration includes this site in its cors_domains setting. " +
      "See Moonraker docs for details on configuring CORS."
    );
  }

  if (err instanceof MoonrakerApiError) {
    if (err.status === 401 || err.status === 403) {
      return "Authentication required. Enter your Moonraker API key.";
    }
    if (err.status === 404) {
      return `File not found: ${err.message}`;
    }
    return `Moonraker error (${err.status}): ${err.message}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "An unexpected error occurred while connecting to Moonraker.";
}

export class MoonrakerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MoonrakerApiError";
  }
}

export async function fetchFileList(options: MoonrakerConnectionOptions): Promise<MoonrakerFileEntry[]> {
  const url = `${options.baseUrl}/server/files/list?root=config`;
  const response = await fetch(url, {
    headers: buildHeaders(options),
    mode: "cors",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new MoonrakerApiError(response.status, body || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as MoonrakerListResult;
  return data.result;
}

export async function fetchFile(options: MoonrakerConnectionOptions, filePath: string): Promise<string> {
  const url = `${options.baseUrl}/server/files/config/${encodeURIComponent(filePath)}`;
  const response = await fetch(url, {
    headers: buildHeaders(options),
    mode: "cors",
  });

  if (!response.ok) {
    throw new MoonrakerApiError(response.status, filePath);
  }

  return response.text();
}

export async function testConnection(options: MoonrakerConnectionOptions): Promise<boolean> {
  try {
    await fetchFileList(options);
    return true;
  } catch {
    return false;
  }
}
