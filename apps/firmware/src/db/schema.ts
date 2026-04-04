import type { Database } from "bun:sqlite";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS builds (
  id              TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'queued',
  board_id        TEXT NOT NULL,
  config_hash     TEXT NOT NULL,
  klipper_commit  TEXT NOT NULL,
  cache_key       TEXT NOT NULL,
  config_content  TEXT NOT NULL,
  progress        TEXT,
  error           TEXT,
  output_filename TEXT,
  ip_address      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  started_at      TEXT,
  completed_at    TEXT
);

CREATE TABLE IF NOT EXISTS build_cache (
  cache_key       TEXT PRIMARY KEY,
  output_blob     BLOB NOT NULL,
  output_filename TEXT NOT NULL,
  board_id        TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_accessed   TEXT NOT NULL DEFAULT (datetime('now')),
  access_count    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_address      TEXT NOT NULL,
  window_start    TEXT NOT NULL,
  request_count   INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_address, window_start)
);

CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
CREATE INDEX IF NOT EXISTS idx_builds_cache_key ON builds(cache_key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_build_cache_last_accessed ON build_cache(last_accessed);
`;

export function initializeSchema(db: Database): void {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA_SQL);
}
