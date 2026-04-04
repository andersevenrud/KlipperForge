import { config } from "../../config";
import { getDb } from "../client";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

function getWindowStart(): string {
  const now = new Date();
  const windowMs = config.rateLimitWindowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  return windowStart.toISOString();
}

export function checkRateLimit(ipAddress: string): RateLimitResult {
  const db = getDb();
  const windowStart = getWindowStart();

  const row = db
    .query<{ request_count: number }, [string, string]>(
      "SELECT request_count FROM rate_limits WHERE ip_address = ? AND window_start = ?",
    )
    .get(ipAddress, windowStart);

  const count = row?.request_count ?? 0;
  const remaining = Math.max(0, config.rateLimitMaxRequests - count);

  return { allowed: count < config.rateLimitMaxRequests, remaining };
}

export function incrementRateLimit(ipAddress: string): void {
  const db = getDb();
  const windowStart = getWindowStart();

  db.run(
    `INSERT INTO rate_limits (ip_address, window_start, request_count)
     VALUES (?, ?, 1)
     ON CONFLICT(ip_address, window_start) DO UPDATE SET request_count = request_count + 1`,
    [ipAddress, windowStart],
  );
}

export function cleanupExpiredLimits(): void {
  const db = getDb();
  const cutoff = new Date(Date.now() - config.rateLimitWindowSeconds * 2 * 1000).toISOString();
  db.run("DELETE FROM rate_limits WHERE window_start < ?", [cutoff]);
}
