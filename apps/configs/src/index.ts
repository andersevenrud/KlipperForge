import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config";
import { closeDb } from "./db/client";
import { cleanupExpiredLimits } from "./db/queries/rate-limits";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./routes/auth";
import { configsRouter } from "./routes/configs";
import { healthRouter } from "./routes/health";
import { revisionsRouter } from "./routes/revisions";
import { sharesRouter } from "./routes/shares";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: config.appUrl,
    credentials: true,
  }),
);
app.onError(errorHandler);

app.route("/api/health", healthRouter);
app.route("/api/auth", authRouter);
app.route("/api/configs", configsRouter);
app.route("/api/configs", revisionsRouter);
app.route("/api", sharesRouter);

function start(): void {
  if (!config.sessionSecret) {
    console.error("SESSION_SECRET is required. Set it in your environment.");
    process.exit(1);
  }

  console.log(`Config storage server listening on port ${config.port}`);
  Bun.serve({
    port: config.port,
    fetch: app.fetch,
  });
}

start();

const cleanupInterval = setInterval(cleanupExpiredLimits, 60_000);

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  clearInterval(cleanupInterval);
  closeDb();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
