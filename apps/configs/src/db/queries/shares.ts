import { getDb } from "../client";

interface ShareRow {
  id: string;
  config_id: string;
  share_token: string;
  created_at: string;
  access_count: number;
  last_accessed: string | null;
}

interface SharedConfigResult {
  config_name: string;
  document: string;
  revision_number: number;
  share_created_at: string;
  owner_username: string;
}

function generateShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export function createShare(configId: string): ShareRow {
  const db = getDb();

  // Enforce one share link per config — return existing if present
  const existing = db.query<ShareRow, [string]>("SELECT * FROM shares WHERE config_id = ? LIMIT 1").get(configId);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const shareToken = generateShareToken();

  db.run("INSERT INTO shares (id, config_id, share_token) VALUES (?, ?, ?)", [id, configId, shareToken]);

  const created = db.query<ShareRow, [string]>("SELECT * FROM shares WHERE id = ?").get(id);
  if (!created) throw new Error("Failed to create share");
  return created;
}

export function deleteShare(shareId: string): void {
  const db = getDb();
  db.run("DELETE FROM shares WHERE id = ?", [shareId]);
}

export function getShareById(shareId: string): ShareRow | null {
  const db = getDb();
  return db.query<ShareRow, [string]>("SELECT * FROM shares WHERE id = ?").get(shareId);
}

export function listSharesByConfig(configId: string): ShareRow[] {
  const db = getDb();
  return db
    .query<ShareRow, [string]>("SELECT * FROM shares WHERE config_id = ? ORDER BY created_at DESC")
    .all(configId);
}

export function getConfigIdByShareToken(shareToken: string): string | null {
  const db = getDb();
  const row = db
    .query<{ config_id: string }, [string]>("SELECT config_id FROM shares WHERE share_token = ?")
    .get(shareToken);
  return row?.config_id ?? null;
}

export function getSharedConfig(shareToken: string): SharedConfigResult | null {
  const db = getDb();

  const result = db
    .query<SharedConfigResult, [string]>(
      `SELECT
        c.name as config_name,
        r.document,
        r.revision_number,
        s.created_at as share_created_at,
        u.username as owner_username
      FROM shares s
      JOIN configs c ON c.id = s.config_id
      JOIN revisions r ON r.config_id = c.id AND r.revision_number = c.current_revision
      JOIN users u ON u.id = c.user_id
      WHERE s.share_token = ?`,
    )
    .get(shareToken);

  if (result) {
    db.run("UPDATE shares SET access_count = access_count + 1, last_accessed = datetime('now') WHERE share_token = ?", [
      shareToken,
    ]);
  }

  return result;
}
