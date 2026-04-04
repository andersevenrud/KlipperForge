import type { CachedBuildResult } from "../../types";
import { getDb } from "../client";

interface CacheRow {
  cache_key: string;
  output_blob: Uint8Array;
  output_filename: string;
  board_id: string;
  created_at: string;
  last_accessed: string;
  access_count: number;
}

export function getCachedBuild(cacheKey: string): CachedBuildResult | null {
  const db = getDb();
  const row = db.query<CacheRow, [string]>("SELECT * FROM build_cache WHERE cache_key = ?").get(cacheKey);

  if (!row) return null;

  db.run(
    "UPDATE build_cache SET last_accessed = datetime('now'), access_count = access_count + 1 WHERE cache_key = ?",
    [cacheKey],
  );

  return { blob: row.output_blob, filename: row.output_filename };
}

export function storeCachedBuild(cacheKey: string, blob: Uint8Array, filename: string, boardId: string): void {
  const db = getDb();
  db.run(
    `INSERT OR REPLACE INTO build_cache (cache_key, output_blob, output_filename, board_id)
     VALUES (?, ?, ?, ?)`,
    [cacheKey, blob, filename, boardId],
  );
}

export function getCacheSize(): number {
  const db = getDb();
  const row = db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM build_cache").get();
  return row?.count ?? 0;
}

export function getCacheSizeBytes(): number {
  const db = getDb();
  const row = db
    .query<{ total: number }, []>("SELECT COALESCE(SUM(LENGTH(output_blob)), 0) as total FROM build_cache")
    .get();
  return row?.total ?? 0;
}

export function evictByKlipperCommit(currentCommit: string): number {
  const db = getDb();
  const result = db.run("DELETE FROM build_cache WHERE cache_key NOT LIKE ?", [`%:${currentCommit}`]);
  return result.changes;
}

export function evictByTtl(ttlSeconds: number): number {
  const db = getDb();
  const cutoff = new Date(Date.now() - ttlSeconds * 1000).toISOString();
  const result = db.run("DELETE FROM build_cache WHERE last_accessed < ?", [cutoff]);
  return result.changes;
}

export function evictLeastRecentlyAccessed(targetCount: number): number {
  const db = getDb();
  const result = db.run(
    `DELETE FROM build_cache WHERE cache_key NOT IN (
      SELECT cache_key FROM build_cache ORDER BY last_accessed DESC LIMIT ?
    )`,
    [targetCount],
  );
  return result.changes;
}
