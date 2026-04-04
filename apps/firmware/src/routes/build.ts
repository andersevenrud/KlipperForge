import { randomUUIDv7 } from "bun";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { config } from "../config";
import { createBuild, getBuild, updateBuildStatus } from "../db/queries/builds";
import { getClientIp, rateLimitMiddleware } from "../middleware/rate-limit";
import { loadBoardJson } from "../services/board-data";
import { getLog, subscribe } from "../services/build-log";
import { isQueueFull, processQueue } from "../services/build-queue";
import { lookupCache } from "../services/cache";
import { findPresetForMcu, generateDotConfig, hashConfig } from "../services/config-generator";
import { getKlipperCommit } from "../services/klipper-source";
import type { BuildRequest } from "../types";
import { toBuildStatusResponse } from "../types";
import { sanitizeFilename } from "../utils/sanitize";

export const buildRouter = new Hono();

buildRouter.post("/", rateLimitMiddleware, async (c) => {
  const body = await c.req.json<BuildRequest>();

  if (!body.boardId || typeof body.boardId !== "string" || !body.interface || typeof body.interface !== "string") {
    console.log("[route] Missing or invalid boardId/interface");
    return c.json({ error: "boardId and interface are required" }, 400);
  }

  console.log(`[route] POST /builds — boardId=${body.boardId} interface=${body.interface}`);

  const boardData = loadBoardJson(body.boardId);
  if (!boardData) {
    console.log(`[route] Board not found: ${body.boardId}`);
    return c.json({ error: "Board not found" }, 404);
  }

  const validMcus = [boardData.mcu, ...(boardData.mcuVariants ?? [])];
  if (body.mcuOverride && !validMcus.includes(body.mcuOverride)) {
    console.log(`[route] Invalid MCU override: ${body.mcuOverride}`);
    return c.json({ error: "Invalid MCU variant" }, 400);
  }

  const effectiveMcu = body.mcuOverride ?? boardData.mcu;
  console.log(`[route] Board MCU: ${effectiveMcu}${body.mcuOverride ? ` (override from ${boardData.mcu})` : ""}`);

  const preset = findPresetForMcu(effectiveMcu);
  if (!preset) {
    console.log(`[route] No preset for MCU: ${effectiveMcu}`);
    return c.json({ error: "No firmware preset for this MCU" }, 400);
  }

  if (!Object.hasOwn(preset.interfaces, body.interface)) {
    console.log(`[route] Invalid interface: ${body.interface}`);
    return c.json({ error: "Invalid interface" }, 400);
  }

  const klipperCommit = getKlipperCommit();
  if (!klipperCommit) {
    console.log("[route] Klipper source not ready");
    return c.json({ error: "Klipper source not ready" }, 503);
  }

  const configContent = generateDotConfig(preset, body.interface, body.options);
  const configHash = hashConfig(configContent);
  const cacheKey = `${configHash}:${klipperCommit}`;
  console.log(`[route] Config hash=${configHash} cacheKey=${cacheKey}`);

  // Check cache
  const cached = config.disableCache ? null : lookupCache(cacheKey);
  if (cached) {
    console.log("[route] Cache hit");
    const jobId = randomUUIDv7();
    const ip = getClientIp(c);
    createBuild(jobId, body.boardId, configHash, klipperCommit, configContent, ip);
    updateBuildStatus(jobId, "completed", {
      outputFilename: cached.filename,
      progress: "Cache hit",
    });
    return c.json({ jobId, status: "cached" }, 201);
  }

  if (isQueueFull()) {
    console.log("[route] Queue full");
    return c.json({ error: "Build queue is full, try again later" }, 429);
  }

  const jobId = randomUUIDv7();
  const ip = getClientIp(c);
  createBuild(jobId, body.boardId, configHash, klipperCommit, configContent, ip);
  console.log(`[route] Created job ${jobId.slice(0, 8)}, starting queue`);

  // Kick off queue processing
  processQueue();

  return c.json({ jobId, status: "queued" }, 201);
});

buildRouter.get("/:jobId", (c) => {
  const { jobId } = c.req.param();
  const job = getBuild(jobId);

  if (!job) {
    return c.json({ error: "Build not found" }, 404);
  }

  return c.json(toBuildStatusResponse(job));
});

buildRouter.get("/:jobId/stream", (c) => {
  const { jobId } = c.req.param();
  const job = getBuild(jobId);

  if (!job) {
    return c.json({ error: "Build not found" }, 404);
  }

  return streamSSE(c, async (stream) => {
    // Send existing log lines
    const existingLines = getLog(jobId);
    for (const line of existingLines) {
      await stream.writeSSE({ event: "log", data: line });
    }

    // Send current status
    const currentJob = getBuild(jobId);
    if (currentJob) {
      await stream.writeSSE({
        event: "status",
        data: JSON.stringify(toBuildStatusResponse(currentJob)),
      });
    }

    // If already terminal, close
    if (currentJob && (currentJob.status === "completed" || currentJob.status === "failed")) {
      await stream.writeSSE({ event: "done", data: currentJob.status });
      return;
    }

    // Subscribe to live log updates
    await new Promise<void>((resolve) => {
      const unsubscribe = subscribe(jobId, async (line) => {
        try {
          await stream.writeSSE({ event: "log", data: line });
        } catch {
          // stream closed
          unsubscribe();
          resolve();
        }
      });

      // Poll for status changes (the build might finish between log lines)
      const statusInterval = setInterval(async () => {
        const latest = getBuild(jobId);
        if (!latest) {
          clearInterval(statusInterval);
          unsubscribe();
          resolve();
          return;
        }

        await stream.writeSSE({
          event: "status",
          data: JSON.stringify(toBuildStatusResponse(latest)),
        });

        if (latest.status === "completed" || latest.status === "failed") {
          await stream.writeSSE({ event: "done", data: latest.status });
          clearInterval(statusInterval);
          unsubscribe();
          resolve();
        }
      }, 1000);

      stream.onAbort(() => {
        clearInterval(statusInterval);
        unsubscribe();
        resolve();
      });
    });
  });
});

buildRouter.get("/:jobId/download", (c) => {
  const { jobId } = c.req.param();
  const job = getBuild(jobId);

  if (!job) {
    return c.json({ error: "Build not found" }, 404);
  }

  if (job.status !== "completed" || !job.outputFilename) {
    return c.json({ error: "Build not ready for download" }, 404);
  }

  const cached = lookupCache(job.cacheKey);
  if (!cached) {
    return c.json({ error: "Build output not found in cache" }, 404);
  }

  let downloadFilename = "firmware.bin";
  const boardData = loadBoardJson(job.boardId);
  if (boardData?.flashFilename) {
    downloadFilename = sanitizeFilename(boardData.flashFilename);
  }

  return new Response(cached.blob as BodyInit, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadFilename}"`,
      "Content-Length": String(cached.blob.length),
    },
  });
});
