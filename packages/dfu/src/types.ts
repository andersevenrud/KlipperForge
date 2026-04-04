export type TimerId = ReturnType<typeof setTimeout>;
export type FlashMethod = "dfu" | "serial";
export type FlashPhase = "connecting" | "erasing" | "writing" | "verifying" | "complete" | "error";

export interface FlashProgress {
  phase: FlashPhase;
  percent: number;
  bytesWritten: number;
  totalBytes: number;
  message: string;
}

export interface FlashResult {
  success: boolean;
  error?: string;
  duration: number;
}

export interface FlashOptions {
  onProgress?: (progress: FlashProgress) => void;
  signal?: AbortSignal;
}
