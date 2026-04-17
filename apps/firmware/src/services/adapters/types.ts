import type { BuildAdapterKind } from "../../config";

export interface BuildRunContext {
  jobId: string;
  buildDir: string;
  outputFile: string;
  signal: AbortSignal;
  log: (line: string) => void;
}

export interface BuildAdapter {
  readonly kind: BuildAdapterKind;
  run(ctx: BuildRunContext): Promise<void>;
  cancelAll(): Promise<void>;
}
