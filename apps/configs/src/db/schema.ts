import type { Database } from "bun:sqlite";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  github_id       INTEGER NOT NULL UNIQUE,
  username        TEXT NOT NULL,
  avatar_url      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS configs (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  user_id          TEXT NOT NULL REFERENCES users(id),
  current_revision INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS revisions (
  config_id        TEXT NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
  revision_number  INTEGER NOT NULL,
  comment          TEXT,
  document         TEXT NOT NULL,
  document_size    INTEGER NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (config_id, revision_number)
);

CREATE TABLE IF NOT EXISTS shares (
  id               TEXT PRIMARY KEY,
  config_id        TEXT NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
  share_token      TEXT NOT NULL UNIQUE,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  access_count     INTEGER NOT NULL DEFAULT 0,
  last_accessed    TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_address       TEXT NOT NULL,
  window_start     TEXT NOT NULL,
  request_count    INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_address, window_start)
);

CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configs(user_id);
CREATE INDEX IF NOT EXISTS idx_revisions_config_id ON revisions(config_id);
CREATE INDEX IF NOT EXISTS idx_shares_share_token ON shares(share_token);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
`;

export function initializeSchema(db: Database): void {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA_SQL);
}
