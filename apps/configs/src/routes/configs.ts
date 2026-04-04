import { Hono } from "hono";
import { config as appConfig } from "../config";
import {
  createConfig,
  deleteConfig,
  getConfigById,
  getConfigWithLatestRevision,
  listConfigsByUser,
  renameConfig,
  updateConfig,
} from "../db/queries/configs";
import { authMiddleware, getSessionUser } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rate-limit";

export const configsRouter = new Hono();

configsRouter.use("*", authMiddleware);

configsRouter.post("/", rateLimitMiddleware, async (c) => {
  const user = getSessionUser(c);
  const body = await c.req.json<{ name?: string; document?: string; comment?: string }>();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return c.json({ error: "Name is required" }, 400);
  }

  if (!body.document || typeof body.document !== "string") {
    return c.json({ error: "Document is required" }, 400);
  }

  try {
    const config = createConfig({
      userId: user.userId,
      name: body.name.trim(),
      document: body.document,
      comment: body.comment,
    });

    return c.json(
      {
        id: config.id,
        name: config.name,
        revision: 1,
        createdAt: config.created_at,
      },
      201,
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("Maximum")) {
      return c.json({ error: err.message }, 409);
    }
    if (err instanceof Error && err.message.includes("exceeds")) {
      return c.json({ error: err.message }, 413);
    }
    throw err;
  }
});

configsRouter.get("/", (c) => {
  const user = getSessionUser(c);
  const configs = listConfigsByUser(user.userId);

  return c.json({
    configs: configs.map((cfg) => ({
      id: cfg.id,
      name: cfg.name,
      currentRevision: cfg.current_revision,
      createdAt: cfg.created_at,
      updatedAt: cfg.updated_at,
    })),
    maxConfigs: appConfig.maxConfigsPerUser,
  });
});

configsRouter.get("/:id", (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");

  const result = getConfigWithLatestRevision(configId);
  if (!result || result.config.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  return c.json({
    id: result.config.id,
    name: result.config.name,
    currentRevision: result.config.current_revision,
    createdAt: result.config.created_at,
    updatedAt: result.config.updated_at,
    latestRevision: {
      number: result.latestRevision.revision_number,
      comment: result.latestRevision.comment,
      document: result.latestRevision.document,
      createdAt: result.latestRevision.created_at,
    },
  });
});

configsRouter.put("/:id", rateLimitMiddleware, async (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");
  const body = await c.req.json<{ document?: string; comment?: string }>();

  if (!body.document || typeof body.document !== "string") {
    return c.json({ error: "Document is required" }, 400);
  }

  const existing = getConfigById(configId);
  if (!existing || existing.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  try {
    const result = updateConfig({
      configId,
      document: body.document,
      comment: body.comment,
    });

    return c.json({
      id: result.config.id,
      revision: result.revision,
      updatedAt: result.config.updated_at,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Maximum")) {
      return c.json({ error: err.message }, 409);
    }
    if (err instanceof Error && err.message.includes("exceeds")) {
      return c.json({ error: err.message }, 413);
    }
    throw err;
  }
});

configsRouter.patch("/:id", async (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");
  const body = await c.req.json<{ name?: string }>();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return c.json({ error: "Name is required" }, 400);
  }

  const existing = getConfigById(configId);
  if (!existing || existing.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  renameConfig(configId, body.name.trim());

  return c.json({ id: configId, name: body.name.trim() });
});

configsRouter.delete("/:id", (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");

  const existing = getConfigById(configId);
  if (!existing || existing.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  deleteConfig(configId);

  return c.json({ ok: true });
});
