import type { Context } from "hono";

export function errorHandler(err: Error, c: Context): Response {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
}
