import Docker from "dockerode";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config";
import { closeDb } from "./db/client";
import { failStaleBuilds } from "./db/queries/builds";
import { cleanupExpiredLimits } from "./db/queries/rate-limits";
import { errorHandler } from "./middleware/error-handler";
import { boardsRouter } from "./routes/boards";
import { buildRouter } from "./routes/build";
import { healthRouter } from "./routes/health";
import { getBuildAdapter } from "./services/adapters";
import { cleanupStaleLogs } from "./services/build-log";
import { runCacheEviction } from "./services/cache";
import { ensureKlipperSource } from "./services/klipper-source";

const app = new Hono();

app.use("*", cors());
app.onError(errorHandler);

app.route("/api/health", healthRouter);
app.route("/api/boards", boardsRouter);
app.route("/api/builds", buildRouter);

async function checkDocker(): Promise<void> {
  console.log(`Checking Docker (socket: ${config.dockerSocket})...`);
  const docker = new Docker({ socketPath: config.dockerSocket });

  try {
    await docker.ping();
    console.log("Docker connection OK");
  } catch (err) {
    console.error("Docker is not reachable:", err instanceof Error ? err.message : err);
    console.error("Builds will fail until Docker is available.");
    return;
  }

  try {
    const image = docker.getImage(config.builderImage);
    await image.inspect();
    console.log(`Builder image "${config.builderImage}" found`);
  } catch {
    console.warn(`Builder image "${config.builderImage}" not found!`);
    console.warn("Build it with: docker build -t klipperforge-builder:latest -f docker/builder.Dockerfile .");
  }
}

async function start(): Promise<void> {
  const staleCount = failStaleBuilds();
  if (staleCount > 0) {
    console.log(`Recovered ${staleCount} stale build(s) from previous run`);
  }

  console.log(`Build adapter: ${config.buildAdapter}`);
  if (config.buildAdapter === "docker") {
    await checkDocker();
  }

  console.log("Initializing Klipper source...");
  await ensureKlipperSource();

  console.log(`Firmware build server listening on port ${config.port}`);
  Bun.serve({
    port: config.port,
    fetch: app.fetch,
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

const cleanupInterval = setInterval(() => {
  cleanupExpiredLimits();
  cleanupStaleLogs();
  runCacheEviction();
}, 60_000);

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down...`);
  clearInterval(cleanupInterval);

  await getBuildAdapter().cancelAll();

  failStaleBuilds();
  closeDb();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
