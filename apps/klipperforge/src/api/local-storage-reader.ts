interface LocalConfigEntry {
  id: string;
  name: string;
  currentRevision: number;
  revisions: number[];
  createdAt: string;
  updatedAt: string;
}

interface LocalRevisionData {
  document: string;
  comment: string | null;
  createdAt: string;
}

interface LocalIndex {
  configs: LocalConfigEntry[];
}

const INDEX_KEY = "klipperforge:index";

function revisionKey(configId: string, revNumber: number): string {
  return `klipperforge:rev:${configId}:${revNumber}`;
}

function readIndex(): LocalIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return { configs: [] };
    return JSON.parse(raw) as LocalIndex;
  } catch {
    return { configs: [] };
  }
}

export function hasLocalConfigs(): boolean {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return false;
    const index = JSON.parse(raw) as LocalIndex;
    return index.configs.length > 0;
  } catch {
    return false;
  }
}

export function readLocalConfigIndex(): LocalConfigEntry[] {
  return readIndex().configs;
}

export function readLocalConfigRevision(configId: string, revNumber: number): LocalRevisionData | null {
  try {
    const raw = localStorage.getItem(revisionKey(configId, revNumber));
    if (!raw) return null;
    return JSON.parse(raw) as LocalRevisionData;
  } catch {
    return null;
  }
}

export function clearLocalConfigs(configIds: string[]): void {
  const index = readIndex();
  const idsToRemove = new Set(configIds);

  for (const config of index.configs) {
    if (idsToRemove.has(config.id)) {
      for (const rev of config.revisions) {
        localStorage.removeItem(revisionKey(config.id, rev));
      }
    }
  }

  index.configs = index.configs.filter((c) => !idsToRemove.has(c.id));

  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // Ignore write failures during cleanup
  }
}
