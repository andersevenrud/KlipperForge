import type { BuildJob, BuildStatus } from "../../types";
import { getDb } from "../client";

interface BuildRow {
  id: string;
  status: string;
  board_id: string;
  config_hash: string;
  klipper_commit: string;
  cache_key: string;
  config_content: string;
  progress: string | null;
  error: string | null;
  output_filename: string | null;
  ip_address: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

function rowToJob(row: BuildRow): BuildJob {
  return {
    id: row.id,
    status: row.status as BuildStatus,
    boardId: row.board_id,
    configHash: row.config_hash,
    klipperCommit: row.klipper_commit,
    cacheKey: row.cache_key,
    configContent: row.config_content,
    progress: row.progress,
    error: row.error,
    outputFilename: row.output_filename,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function createBuild(
  id: string,
  boardId: string,
  configHash: string,
  klipperCommit: string,
  configContent: string,
  ipAddress: string,
): BuildJob {
  const db = getDb();
  const cacheKey = `${configHash}:${klipperCommit}`;
  db.run(
    `INSERT INTO builds (id, board_id, config_hash, klipper_commit, cache_key, config_content, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, boardId, configHash, klipperCommit, cacheKey, configContent, ipAddress],
  );
  // biome-ignore lint/style/noNonNullAssertion: row was just inserted
  return getBuild(id)!;
}

export function getBuild(id: string): BuildJob | null {
  const db = getDb();
  const row = db.query<BuildRow, [string]>("SELECT * FROM builds WHERE id = ?").get(id);
  return row ? rowToJob(row) : null;
}

export function updateBuildStatus(
  id: string,
  status: BuildStatus,
  updates?: {
    progress?: string;
    error?: string;
    outputFilename?: string;
  },
): void {
  const db = getDb();
  const now = new Date().toISOString();

  if (status === "building") {
    db.run("UPDATE builds SET status = ?, started_at = ? WHERE id = ?", [status, now, id]);
  } else if (status === "completed" || status === "failed") {
    db.run(
      "UPDATE builds SET status = ?, completed_at = ?, progress = ?, error = ?, output_filename = ? WHERE id = ?",
      [status, now, updates?.progress ?? null, updates?.error ?? null, updates?.outputFilename ?? null, id],
    );
  } else {
    db.run("UPDATE builds SET status = ?, progress = ? WHERE id = ?", [status, updates?.progress ?? null, id]);
  }
}

export function getQueuedBuilds(): BuildJob[] {
  const db = getDb();
  const rows = db.query<BuildRow, []>("SELECT * FROM builds WHERE status = 'queued' ORDER BY created_at ASC").all();
  return rows.map(rowToJob);
}

export function getActiveBuildsCount(): number {
  const db = getDb();
  const row = db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM builds WHERE status = 'building'").get();
  return row?.count ?? 0;
}

export function failStaleBuilds(): number {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.run(
    "UPDATE builds SET status = 'failed', error = 'Server restarted', completed_at = ? WHERE status IN ('queued', 'building')",
    [now],
  );
  return result.changes;
}
