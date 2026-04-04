import type { ConfigStorageAdapter } from "./config-storage-adapter";
import {
  createConfig,
  createShare,
  deleteConfig,
  deleteShare,
  fetchConfig,
  fetchConfigList,
  fetchRevision,
  fetchRevisionList,
  fetchShareList,
  renameConfig,
  updateConfigRevision,
} from "./configs";

export function createRemoteStorageAdapter(): ConfigStorageAdapter {
  return {
    mode: "remote",
    supportsSharing: true,
    maxConfigs: 50,
    fetchConfigList,
    fetchConfig,
    createConfig,
    updateConfigRevision,
    deleteConfig,
    renameConfig,
    fetchRevisionList,
    fetchRevision,
    createShare,
    fetchShareList,
    deleteShare,
  };
}
