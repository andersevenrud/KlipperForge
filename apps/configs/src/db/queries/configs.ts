import { config as appConfig } from "../../config";
import { getDb } from "../client";

interface ConfigRow {
  id: string;
  name: string;
  user_id: string;
  current_revision: number;
  created_at: string;
  updated_at: string;
}

interface RevisionRow {
  config_id: string;
  revision_number: number;
  comment: string | null;
  document: string;
  document_size: number;
  created_at: string;
}

interface CreateConfigParams {
  userId: string;
  name: string;
  document: string;
  comment?: string;
}

interface UpdateConfigParams {
  configId: string;
  document: string;
  comment?: string;
}

export function createConfig(params: CreateConfigParams): ConfigRow {
  const db = getDb();
  const documentSize = new TextEncoder().encode(params.document).length;

  if (documentSize > appConfig.maxDocumentSizeBytes) {
    throw new Error(`Document exceeds maximum size of ${appConfig.maxDocumentSizeBytes} bytes`);
  }

  const userConfigCount = db
    .query<{ count: number }, [string]>("SELECT COUNT(*) as count FROM configs WHERE user_id = ?")
    .get(params.userId);

  if ((userConfigCount?.count ?? 0) >= appConfig.maxConfigsPerUser) {
    throw new Error(`Maximum of ${appConfig.maxConfigsPerUser} configs per user reached`);
  }

  const id = crypto.randomUUID();

  db.run("INSERT INTO configs (id, name, user_id) VALUES (?, ?, ?)", [id, params.name, params.userId]);

  db.run(
    "INSERT INTO revisions (config_id, revision_number, comment, document, document_size) VALUES (?, 1, ?, ?, ?)",
    [id, params.comment ?? null, params.document, documentSize],
  );

  const created = db.query<ConfigRow, [string]>("SELECT * FROM configs WHERE id = ?").get(id);
  if (!created) throw new Error("Failed to create config");
  return created;
}

export function updateConfig(params: UpdateConfigParams): { config: ConfigRow; revision: number } {
  const db = getDb();
  const documentSize = new TextEncoder().encode(params.document).length;

  if (documentSize > appConfig.maxDocumentSizeBytes) {
    throw new Error(`Document exceeds maximum size of ${appConfig.maxDocumentSizeBytes} bytes`);
  }

  const existing = db.query<ConfigRow, [string]>("SELECT * FROM configs WHERE id = ?").get(params.configId);

  if (!existing) {
    throw new Error("Config not found");
  }

  const revisionCount = db
    .query<{ count: number }, [string]>("SELECT COUNT(*) as count FROM revisions WHERE config_id = ?")
    .get(params.configId);

  if ((revisionCount?.count ?? 0) >= appConfig.maxRevisionsPerConfig) {
    throw new Error(`Maximum of ${appConfig.maxRevisionsPerConfig} revisions per config reached`);
  }

  const newRevision = existing.current_revision + 1;

  db.run(
    "INSERT INTO revisions (config_id, revision_number, comment, document, document_size) VALUES (?, ?, ?, ?, ?)",
    [params.configId, newRevision, params.comment ?? null, params.document, documentSize],
  );

  db.run("UPDATE configs SET current_revision = ?, updated_at = datetime('now') WHERE id = ?", [
    newRevision,
    params.configId,
  ]);

  const updated = db.query<ConfigRow, [string]>("SELECT * FROM configs WHERE id = ?").get(params.configId);
  if (!updated) throw new Error("Failed to update config");

  return { config: updated, revision: newRevision };
}

export function listConfigsByUser(userId: string): ConfigRow[] {
  const db = getDb();
  return db.query<ConfigRow, [string]>("SELECT * FROM configs WHERE user_id = ? ORDER BY updated_at DESC").all(userId);
}

export function getConfigById(configId: string): ConfigRow | null {
  const db = getDb();
  return db.query<ConfigRow, [string]>("SELECT * FROM configs WHERE id = ?").get(configId);
}

export function getConfigWithLatestRevision(
  configId: string,
): { config: ConfigRow; latestRevision: RevisionRow } | null {
  const db = getDb();
  const configRow = db.query<ConfigRow, [string]>("SELECT * FROM configs WHERE id = ?").get(configId);

  if (!configRow) return null;

  const revision = db
    .query<RevisionRow, [string, number]>("SELECT * FROM revisions WHERE config_id = ? AND revision_number = ?")
    .get(configId, configRow.current_revision);

  if (!revision) return null;

  return { config: configRow, latestRevision: revision };
}

export function renameConfig(configId: string, name: string): void {
  const db = getDb();
  db.run("UPDATE configs SET name = ?, updated_at = datetime('now') WHERE id = ?", [name, configId]);
}

export function deleteConfig(configId: string): void {
  const db = getDb();
  db.run("DELETE FROM configs WHERE id = ?", [configId]);
}
