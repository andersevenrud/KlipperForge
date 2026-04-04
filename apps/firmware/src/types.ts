export type BuildStatus = "queued" | "building" | "completed" | "failed" | "cached";

export interface BuildJob {
  id: string;
  status: BuildStatus;
  boardId: string;
  configHash: string;
  klipperCommit: string;
  cacheKey: string;
  configContent: string;
  progress: string | null;
  error: string | null;
  outputFilename: string | null;
  ipAddress: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface BuildRequest {
  boardId: string;
  interface: string;
  options?: Record<string, string>;
  mcuOverride?: string;
  klipperRef?: string;
}

interface BuildStatusResponse {
  jobId: string;
  status: BuildStatus;
  progress: string | null;
  error: string | null;
  downloadReady: boolean;
  cached: boolean;
}

export function toBuildStatusResponse(job: BuildJob): BuildStatusResponse {
  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    downloadReady: job.status === "completed" && job.outputFilename !== null,
    cached: job.progress === "Cache hit",
  };
}

export type FlashMethod = "dfu" | "serial" | "uf2";

interface PresetOption {
  key: string;
  label: string;
  type: "select";
  values: string[];
  default: string;
}

export interface FirmwareInterface {
  label: string;
  config: Record<string, string>;
  options?: PresetOption[];
}

export interface BootloaderOffset {
  label: string;
  flashAddress?: string;
  config?: Record<string, string>;
}

export interface ClockRef {
  label: string;
  config?: Record<string, string>;
}

export interface FirmwarePreset {
  mcuFamily: string;
  mcuPatterns: string[];
  outputFile: string;
  flashMethods?: FlashMethod[];
  base: Record<string, string>;
  interfaces: Record<string, FirmwareInterface>;
  bootloaderOffsets: Record<string, BootloaderOffset>;
  clockRefs: Record<string, ClockRef>;
}

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
  flashFilename?: string;
  flash?: BoardFlashInfo;
}

export interface PresetResponseInterface {
  id: string;
  label: string;
  options?: PresetOption[];
}

export interface PresetResponseOffset {
  id: string;
  label: string;
  flashAddress?: string;
}

export interface PresetResponseClockRef {
  id: string;
  label: string;
}

export interface CachedBuildResult {
  blob: Uint8Array;
  filename: string;
}

export interface PresetResponse {
  mcuFamily: string;
  outputFile: string;
  flashFilename?: string;
  flashMethods?: FlashMethod[];
  interfaces: PresetResponseInterface[];
  bootloaderOffsets: PresetResponseOffset[];
  clockRefs: PresetResponseClockRef[];
}
