export type FlashMethod = "dfu" | "serial" | "uf2";

export interface BoardFlashInfo {
  dfuModeInstructions?: string;
  serialFlashBaud?: number;
  serialFlashParity?: string;
}

export interface BoardEntry {
  id: string;
  name: string;
  vendor: string;
  mcu: string;
  mcuVariants?: string[];
  hasPreset: boolean;
  flash?: BoardFlashInfo;
}

interface PresetInterfaceOption {
  key: string;
  label: string;
  type: "select";
  values: string[];
  default: string;
}
export interface PresetInterface {
  id: string;
  label: string;
  options?: PresetInterfaceOption[];
}
export interface PresetOffset {
  id: string;
  label: string;
  flashAddress?: string;
}
export interface PresetClockRef {
  id: string;
  label: string;
}

export interface PresetResponse {
  mcuFamily: string;
  outputFile: string;
  flashFilename?: string;
  flashMethods?: FlashMethod[];
  interfaces: PresetInterface[];
  bootloaderOffsets: PresetOffset[];
  clockRefs: PresetClockRef[];
}

export interface BuildResponse {
  jobId: string;
  status: "queued" | "cached";
}

export interface BuildStatusResponse {
  jobId: string;
  status: "queued" | "building" | "completed" | "failed" | "cached";
  progress: string | null;
  error: string | null;
  downloadReady: boolean;
  cached: boolean;
}

export interface KlipperVersionInfo {
  commit: string;
  commitShort: string;
  commitDate: string | null;
  version: string | null;
  sourceDate: string;
}
