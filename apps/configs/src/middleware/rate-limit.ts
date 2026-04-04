import type { Context, Next } from "hono";
import { config } from "../config";
import { checkRateLimit, incrementRateLimit } from "../db/queries/rate-limits";

function getClientIp(c: Context): string {
  if (config.trustProxy) {
    return c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? c.req.header("x-real-ip") ?? "127.0.0.1";
  }
  return "127.0.0.1";
}

export async function rateLimitMiddleware(c: Context, next: Next): Promise<Response | undefined> {
  const ip = getClientIp(c);

  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }

  incrementRateLimit(ip);

  c.header("X-RateLimit-Remaining", String(remaining - 1));
  await next();
  return undefined;
}
