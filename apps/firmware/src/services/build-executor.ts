import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "../config";
import { updateBuildStatus } from "../db/queries/builds";
import type { CachedBuildResult } from "../types";
import { isValidFilename } from "../utils/sanitize";
import { getBuildAdapter } from "./adapters";
import { appendLog } from "./build-log";
import { storeInCache } from "./cache";

export async function executeBuild(
  jobId: string,
  configContent: string,
  cacheKey: string,
  boardId: string,
  outputFile: string,
): Promise<CachedBuildResult> {
  const buildBase = config.buildsPath || tmpdir();
  const buildDir = join(buildBase, `klipperforge-build-${jobId}`);
  mkdirSync(buildDir, { recursive: true });

  const log = (msg: string) => {
    console.log(`[build:${jobId.slice(0, 8)}] ${msg}`);
    appendLog(jobId, msg);
  };

  const adapter = getBuildAdapter();
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => {
    log("Build timed out");
    abortController.abort();
  }, config.buildTimeoutMs);

  try {
    if (!isValidFilename(outputFile)) {
      throw new Error(`Invalid output filename: ${outputFile}`);
    }

    writeFileSync(join(buildDir, ".config"), configContent);
    log("Wrote .config file");
    updateBuildStatus(jobId, "building", { progress: `Starting (${adapter.kind})` });

    await adapter.run({
      jobId,
      buildDir,
      outputFile,
      signal: abortController.signal,
      log,
    });

    if (abortController.signal.aborted) {
      throw new Error("Build timed out");
    }

    log("Build exited successfully, reading output");
    const outputPath = join(buildDir, outputFile);
    const blob = new Uint8Array(readFileSync(outputPath));
    log(`Output file: ${outputFile} (${blob.length} bytes)`);

    storeInCache(cacheKey, blob, outputFile, boardId);
    log("Stored in cache");

    return { blob, filename: outputFile };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log(`Build error: ${msg}`);
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
    rmSync(buildDir, { recursive: true, force: true });
  }
}
