import { Hono } from "hono";
import { getCacheSize, getCacheSizeBytes } from "../db/queries/cache";
import { getQueueDepth } from "../services/build-queue";
import { getKlipperCommit, getKlipperVersionInfo } from "../services/klipper-source";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  return c.json({
    status: "ok",
    klipperCommit: getKlipperCommit(),
    queueDepth: getQueueDepth(),
    cacheEntries: getCacheSize(),
    cacheSizeMb: Math.round((getCacheSizeBytes() / 1024 / 1024) * 10) / 10,
  });
});

healthRouter.get("/klipper-version", (c) => {
  const info = getKlipperVersionInfo();
  if (!info) {
    return c.json({ error: "Klipper source not initialized" }, 503);
  }
  return c.json(info);
});
