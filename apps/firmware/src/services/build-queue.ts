import { config } from "../config";
import { getActiveBuildsCount, getQueuedBuilds, updateBuildStatus } from "../db/queries/builds";
import { executeBuild } from "./build-executor";
import { appendLog } from "./build-log";
import { lookupCache } from "./cache";

let processing = false;

export function getQueueDepth(): number {
  return getQueuedBuilds().length + getActiveBuildsCount();
}

export function isQueueFull(): boolean {
  return getQueueDepth() >= config.maxPendingBuilds;
}

export function processQueue(): void {
  if (processing) return;
  processing = true;

  try {
    while (true) {
      const activeCount = getActiveBuildsCount();
      if (activeCount >= config.maxConcurrentBuilds) {
        console.log(`[queue] At capacity (${activeCount}/${config.maxConcurrentBuilds} active)`);
        break;
      }

      const queued = getQueuedBuilds();
      if (queued.length === 0) {
        console.log("[queue] No queued jobs");
        break;
      }

      const job = queued[0];
      console.log(`[queue] Dispatching job ${job.id.slice(0, 8)} (board: ${job.boardId})`);

      // Mark as building BEFORE dispatching so the loop doesn't re-pick it
      updateBuildStatus(job.id, "building", { progress: "Starting" });

      // Fire-and-forget — processJob handles its own status updates
      processJob(job.id, job.configContent, job.cacheKey, job.boardId);
    }
  } finally {
    processing = false;
  }
}

async function processJob(jobId: string, configContent: string, cacheKey: string, boardId: string): Promise<void> {
  try {
    // Check cache first
    const cached = config.disableCache ? null : lookupCache(cacheKey);
    if (cached) {
      console.log(`[queue] Cache hit for job ${jobId.slice(0, 8)}`);
      appendLog(jobId, "Cache hit — skipping build");
      updateBuildStatus(jobId, "completed", {
        outputFilename: cached.filename,
        progress: "Cache hit",
      });
      return;
    }

    // Determine output file from board preset
    const { findPresetForMcu } = await import("./config-generator");
    const { loadBoardJson } = await import("./board-data");
    let outputFile = "klipper.bin";
    try {
      const boardData = loadBoardJson(boardId);
      if (boardData) {
        const preset = findPresetForMcu(boardData.mcu);
        if (preset) outputFile = preset.outputFile;
      }
    } catch {
      console.warn(`[queue] Could not load board data for ${boardId}, using default output file`);
    }

    console.log(`[queue] Starting build for job ${jobId.slice(0, 8)} (output: ${outputFile})`);
    const result = await executeBuild(jobId, configContent, cacheKey, boardId, outputFile);

    console.log(`[queue] Build completed for job ${jobId.slice(0, 8)}`);
    updateBuildStatus(jobId, "completed", {
      outputFilename: result.filename,
      progress: "Build completed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown build error";
    console.error(`[queue] Build failed for job ${jobId.slice(0, 8)}: ${message}`);
    appendLog(jobId, `Error: ${message}`);
    updateBuildStatus(jobId, "failed", { error: message });
  }

  // Process next in queue
  processQueue();
}
