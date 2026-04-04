import type { ConfigStorageAdapter } from "./config-storage-adapter";
import type {
  ConfigDetailResponse,
  ConfigListResponse,
  ConfigSummary,
  CreateConfigResponse,
  RevisionDetailResponse,
  RevisionListResponse,
  RevisionSummary,
  UpdateConfigResponse,
} from "./config-storage-types";

interface LocalConfigEntry {
  id: string;
  name: string;
  currentRevision: number;
  revisions: number[];
  createdAt: string;
  updatedAt: string;
}

interface LocalIndex {
  configs: LocalConfigEntry[];
}

interface LocalRevisionData {
  document: string;
  comment: string | null;
  createdAt: string;
}

const INDEX_KEY = "klipperforge:index";
const MAX_CONFIGS = 50;
const MAX_REVISIONS = 20;
const MAX_DOCUMENT_SIZE_BYTES = 65_536;

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

function writeIndex(index: LocalIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    throw new Error("Storage quota exceeded. Delete some configs to free space.");
  }
}

function readRevision(configId: string, revNumber: number): LocalRevisionData | null {
  try {
    const raw = localStorage.getItem(revisionKey(configId, revNumber));
    if (!raw) return null;
    return JSON.parse(raw) as LocalRevisionData;
  } catch {
    return null;
  }
}

function writeRevision(configId: string, revNumber: number, data: LocalRevisionData): void {
  try {
    localStorage.setItem(revisionKey(configId, revNumber), JSON.stringify(data));
  } catch {
    throw new Error("Storage quota exceeded. Delete some configs to free space.");
  }
}

function findConfig(index: LocalIndex, id: string): LocalConfigEntry {
  const config = index.configs.find((c) => c.id === id);
  if (!config) throw new Error("Config not found");
  return config;
}

function pruneRevisions(configId: string, revisions: number[]): number[] {
  if (revisions.length <= MAX_REVISIONS) return revisions;

  const sorted = [...revisions].sort((a, b) => b - a);
  const toKeep = sorted.slice(0, MAX_REVISIONS);
  const toRemove = sorted.slice(MAX_REVISIONS);

  for (const rev of toRemove) {
    localStorage.removeItem(revisionKey(configId, rev));
  }

  return toKeep;
}

function toConfigSummary(entry: LocalConfigEntry): ConfigSummary {
  return {
    id: entry.id,
    name: entry.name,
    currentRevision: entry.currentRevision,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function createLocalStorageAdapter(): ConfigStorageAdapter {
  return {
    mode: "local",
    supportsSharing: false,
    maxConfigs: MAX_CONFIGS,

    async fetchConfigList(): Promise<ConfigListResponse> {
      const index = readIndex();
      return {
        configs: index.configs.map(toConfigSummary),
        maxConfigs: MAX_CONFIGS,
      };
    },

    async fetchConfig(id: string): Promise<ConfigDetailResponse> {
      const index = readIndex();
      const config = findConfig(index, id);
      const rev = readRevision(id, config.currentRevision);
      if (!rev) throw new Error("Revision data not found");

      return {
        id: config.id,
        name: config.name,
        currentRevision: config.currentRevision,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        latestRevision: {
          number: config.currentRevision,
          comment: rev.comment,
          document: rev.document,
          createdAt: rev.createdAt,
        },
      };
    },

    async createConfig(name: string, document: string, comment?: string): Promise<CreateConfigResponse> {
      if (new Blob([document]).size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error("Document exceeds maximum size of 64KB");
      }

      const index = readIndex();
      if (index.configs.length >= MAX_CONFIGS) {
        throw new Error(`Maximum of ${MAX_CONFIGS} configs reached. Delete one to create a new one.`);
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const entry: LocalConfigEntry = {
        id,
        name: name.trim(),
        currentRevision: 1,
        revisions: [1],
        createdAt: now,
        updatedAt: now,
      };

      writeRevision(id, 1, { document, comment: comment ?? null, createdAt: now });
      index.configs.push(entry);
      writeIndex(index);

      return { id, name: entry.name, revision: 1, createdAt: now };
    },

    async updateConfigRevision(id: string, document: string, comment?: string): Promise<UpdateConfigResponse> {
      if (new Blob([document]).size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error("Document exceeds maximum size of 64KB");
      }

      const index = readIndex();
      const config = findConfig(index, id);
      const now = new Date().toISOString();
      const nextRevision = config.currentRevision + 1;

      writeRevision(id, nextRevision, { document, comment: comment ?? null, createdAt: now });

      config.currentRevision = nextRevision;
      config.revisions.unshift(nextRevision);
      config.revisions = pruneRevisions(id, config.revisions);
      config.updatedAt = now;
      writeIndex(index);

      return { id, revision: nextRevision, updatedAt: now };
    },

    async deleteConfig(id: string): Promise<void> {
      const index = readIndex();
      const config = findConfig(index, id);

      for (const rev of config.revisions) {
        localStorage.removeItem(revisionKey(id, rev));
      }

      index.configs = index.configs.filter((c) => c.id !== id);
      writeIndex(index);
    },

    async renameConfig(id: string, name: string): Promise<void> {
      const index = readIndex();
      const config = findConfig(index, id);
      config.name = name.trim();
      config.updatedAt = new Date().toISOString();
      writeIndex(index);
    },

    async fetchRevisionList(configId: string): Promise<RevisionListResponse> {
      const index = readIndex();
      const config = findConfig(index, configId);

      const revisions: RevisionSummary[] = [];
      for (const revNum of config.revisions) {
        const rev = readRevision(configId, revNum);
        if (rev) {
          revisions.push({
            number: revNum,
            comment: rev.comment,
            documentSize: new Blob([rev.document]).size,
            createdAt: rev.createdAt,
          });
        }
      }

      return { revisions };
    },

    async fetchRevision(configId: string, revisionNumber: number): Promise<RevisionDetailResponse> {
      const rev = readRevision(configId, revisionNumber);
      if (!rev) throw new Error("Revision not found");

      return {
        number: revisionNumber,
        comment: rev.comment,
        document: rev.document,
        documentSize: new Blob([rev.document]).size,
        createdAt: rev.createdAt,
      };
    },

    async createShare(): Promise<never> {
      throw new Error("Sharing is not available in offline mode");
    },

    async fetchShareList(): Promise<never> {
      throw new Error("Sharing is not available in offline mode");
    },

    async deleteShare(): Promise<never> {
      throw new Error("Sharing is not available in offline mode");
    },
  };
}
