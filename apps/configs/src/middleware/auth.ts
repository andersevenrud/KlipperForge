import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { config } from "../config";

interface SessionUser {
  userId: string;
  githubId: number;
  username: string;
}

interface JwtPayload {
  userId: string;
  githubId: number;
  username: string;
  exp: number;
}

const COOKIE_NAME = "klipperforge_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function createSessionCookie(c: Context, user: SessionUser): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + config.sessionMaxAgeDays * 24 * 60 * 60;
  const token = await sign(
    { userId: user.userId, githubId: user.githubId, username: user.username, exp },
    config.sessionSecret,
  );

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.appUrl.startsWith("https"),
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(c: Context): void {
  setCookie(c, COOKIE_NAME, "", {
    httpOnly: true,
    secure: config.appUrl.startsWith("https"),
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

export async function authMiddleware(c: Context, next: Next): Promise<Response | undefined> {
  const token = getCookie(c, COOKIE_NAME);

  if (!token) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const payload = (await verify(token, config.sessionSecret, "HS256")) as unknown as JwtPayload;
    c.set("user", {
      userId: payload.userId,
      githubId: payload.githubId,
      username: payload.username,
    } satisfies SessionUser);

    // Refresh cookie on each authenticated request
    await createSessionCookie(c, {
      userId: payload.userId,
      githubId: payload.githubId,
      username: payload.username,
    });
  } catch {
    clearSessionCookie(c);
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  await next();
  return undefined;
}

export function getSessionUser(c: Context): SessionUser {
  return c.get("user") as SessionUser;
}
