import { Hono } from "hono";
import { getConfigById } from "../db/queries/configs";
import { getRevision, listRevisions } from "../db/queries/revisions";
import {
  createShare,
  deleteShare,
  getConfigIdByShareToken,
  getShareById,
  getSharedConfig,
  listSharesByConfig,
} from "../db/queries/shares";
import { authMiddleware, getSessionUser } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rate-limit";

export const sharesRouter = new Hono();

// Authenticated routes for managing share links
const manageRouter = new Hono();
manageRouter.use("*", authMiddleware);

manageRouter.post("/:id/share", rateLimitMiddleware, (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");

  const config = getConfigById(configId);
  if (!config || config.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  const share = createShare(configId);

  return c.json(
    {
      id: share.id,
      shareToken: share.share_token,
      createdAt: share.created_at,
    },
    201,
  );
});

manageRouter.get("/:id/shares", (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");

  const config = getConfigById(configId);
  if (!config || config.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  const shares = listSharesByConfig(configId);

  return c.json({
    shares: shares.map((s) => ({
      id: s.id,
      shareToken: s.share_token,
      createdAt: s.created_at,
      accessCount: s.access_count,
      lastAccessed: s.last_accessed,
    })),
  });
});

manageRouter.delete("/:id/shares/:shareId", (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");
  const shareId = c.req.param("shareId");

  const config = getConfigById(configId);
  if (!config || config.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
  }

  const share = getShareById(shareId);
  if (!share || share.config_id !== configId) {
    return c.json({ error: "Share not found" }, 404);
  }

  deleteShare(shareId);

  return c.json({ ok: true });
});

// Public route for accessing shared configs
const publicRouter = new Hono();

publicRouter.get("/:shareToken", rateLimitMiddleware, (c) => {
  const shareToken = c.req.param("shareToken");

  const result = getSharedConfig(shareToken);
  if (!result) {
    return c.json({ error: "Shared config not found" }, 404);
  }

  return c.json({
    name: result.config_name,
    document: result.document,
    revisionNumber: result.revision_number,
    owner: result.owner_username,
    sharedAt: result.share_created_at,
  });
});

publicRouter.get("/:shareToken/revisions", rateLimitMiddleware, (c) => {
  const shareToken = c.req.param("shareToken");
  const configId = getConfigIdByShareToken(shareToken);
  if (!configId) {
    return c.json({ error: "Shared config not found" }, 404);
  }

  const revisions = listRevisions(configId);

  return c.json({
    revisions: revisions.map((r) => ({
      number: r.revision_number,
      comment: r.comment,
      documentSize: r.document_size,
      createdAt: r.created_at,
    })),
  });
});

publicRouter.get("/:shareToken/revisions/:rev", rateLimitMiddleware, (c) => {
  const shareToken = c.req.param("shareToken");
  const revisionNumber = Number(c.req.param("rev"));

  if (Number.isNaN(revisionNumber) || revisionNumber < 1) {
    return c.json({ error: "Invalid revision number" }, 400);
  }

  const configId = getConfigIdByShareToken(shareToken);
  if (!configId) {
    return c.json({ error: "Shared config not found" }, 404);
  }

  const revision = getRevision(configId, revisionNumber);
  if (!revision) {
    return c.json({ error: "Revision not found" }, 404);
  }

  return c.json({
    number: revision.revision_number,
    comment: revision.comment,
    document: revision.document,
    documentSize: revision.document_size,
    createdAt: revision.created_at,
  });
});

sharesRouter.route("/configs", manageRouter);
sharesRouter.route("/shared", publicRouter);
