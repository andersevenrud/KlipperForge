interface FeatureFlags {
  firmwareBuilder: boolean;
  browserFlashTool: boolean;
  configStorage: boolean;
  projectJsonTab: boolean;
}

export const featureFlags: FeatureFlags = {
  firmwareBuilder: import.meta.env.VITE_FEATURE_FIRMWARE_BUILDER !== "false",
  browserFlashTool: import.meta.env.VITE_FEATURE_BROWSER_FLASH_TOOL !== "false",
  configStorage: import.meta.env.VITE_FEATURE_CONFIG_STORAGE !== "false",
  projectJsonTab: import.meta.env.VITE_FEATURE_PROJECT_JSON_TAB === "true",
};
