import { getDb } from "../client";

interface UserRow {
  id: string;
  github_id: number;
  username: string;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string;
}

interface UpsertUserParams {
  githubId: number;
  username: string;
  avatarUrl: string | null;
}

export function upsertUser(params: UpsertUserParams): UserRow {
  const db = getDb();
  const existing = db.query<UserRow, [number]>("SELECT * FROM users WHERE github_id = ?").get(params.githubId);

  if (existing) {
    db.run("UPDATE users SET username = ?, avatar_url = ?, last_login_at = datetime('now') WHERE github_id = ?", [
      params.username,
      params.avatarUrl,
      params.githubId,
    ]);
    return {
      ...existing,
      username: params.username,
      avatar_url: params.avatarUrl,
      last_login_at: new Date().toISOString(),
    };
  }

  const id = crypto.randomUUID();
  db.run("INSERT INTO users (id, github_id, username, avatar_url) VALUES (?, ?, ?, ?)", [
    id,
    params.githubId,
    params.username,
    params.avatarUrl,
  ]);

  const created = db.query<UserRow, [string]>("SELECT * FROM users WHERE id = ?").get(id);
  if (!created) throw new Error("Failed to create user");
  return created;
}
