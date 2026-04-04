import type {
  ConfigDetailResponse,
  ConfigListResponse,
  CreateConfigResponse,
  CreateShareResponse,
  RevisionDetailResponse,
  RevisionListResponse,
  ShareListResponse,
  UpdateConfigResponse,
} from "./config-storage-types";

export interface ConfigStorageAdapter {
  readonly mode: "local" | "remote";
  readonly supportsSharing: boolean;
  readonly maxConfigs: number;

  fetchConfigList(): Promise<ConfigListResponse>;
  fetchConfig(id: string): Promise<ConfigDetailResponse>;
  createConfig(name: string, document: string, comment?: string): Promise<CreateConfigResponse>;
  updateConfigRevision(id: string, document: string, comment?: string): Promise<UpdateConfigResponse>;
  deleteConfig(id: string): Promise<void>;
  renameConfig(id: string, name: string): Promise<void>;
  fetchRevisionList(configId: string): Promise<RevisionListResponse>;
  fetchRevision(configId: string, revisionNumber: number): Promise<RevisionDetailResponse>;
  createShare(configId: string): Promise<CreateShareResponse>;
  fetchShareList(configId: string): Promise<ShareListResponse>;
  deleteShare(configId: string, shareId: string): Promise<void>;
}
