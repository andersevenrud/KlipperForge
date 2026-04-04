import { Hono } from "hono";
import { getConfigById } from "../db/queries/configs";
import { getRevision, listRevisions } from "../db/queries/revisions";
import { authMiddleware, getSessionUser } from "../middleware/auth";

export const revisionsRouter = new Hono();

revisionsRouter.use("*", authMiddleware);

revisionsRouter.get("/:id/revisions", (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");

  const config = getConfigById(configId);
  if (!config || config.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
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

revisionsRouter.get("/:id/revisions/:rev", (c) => {
  const user = getSessionUser(c);
  const configId = c.req.param("id");
  const revisionNumber = Number(c.req.param("rev"));

  if (Number.isNaN(revisionNumber) || revisionNumber < 1) {
    return c.json({ error: "Invalid revision number" }, 400);
  }

  const config = getConfigById(configId);
  if (!config || config.user_id !== user.userId) {
    return c.json({ error: "Config not found" }, 404);
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
