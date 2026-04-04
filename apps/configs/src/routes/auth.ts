import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { config } from "../config";
import { upsertUser } from "../db/queries/users";
import { clearSessionCookie, createSessionCookie } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rate-limit";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  avatar_url: string;
}

export const authRouter = new Hono();

authRouter.get("/github", rateLimitMiddleware, (c) => {
  const state = crypto.randomUUID();

  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: config.appUrl.startsWith("https"),
    sameSite: "Lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: config.githubCallbackUrl,
    scope: "read:user",
    state,
  });

  return c.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

authRouter.get("/github/callback", rateLimitMiddleware, async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  console.log("[auth/callback] code:", !!code, "state:", !!state, "storedState:", !!storedState);

  // Clear the state cookie
  setCookie(c, "oauth_state", "", {
    httpOnly: true,
    secure: config.appUrl.startsWith("https"),
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });

  if (!code || !state || state !== storedState) {
    console.log("[auth/callback] state mismatch — state:", state, "storedState:", storedState);
    return c.redirect(`${config.appUrl}?auth_error=invalid_state`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.githubCallbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("GitHub token exchange failed:", tokenResponse.status);
      return c.redirect(`${config.appUrl}?auth_error=token_exchange_failed`);
    }

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
    console.log("[auth/callback] token exchange:", tokenData.access_token ? "success" : "no token received");
    if (!tokenData.access_token) {
      console.error("GitHub token response missing access_token");
      return c.redirect(`${config.appUrl}?auth_error=no_access_token`);
    }

    // Fetch GitHub user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      console.error("GitHub user fetch failed:", userResponse.status);
      return c.redirect(`${config.appUrl}?auth_error=user_fetch_failed`);
    }

    const githubUser = (await userResponse.json()) as GitHubUserResponse;

    // Upsert user in DB
    const user = upsertUser({
      githubId: githubUser.id,
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
    });

    // Set session cookie
    await createSessionCookie(c, {
      userId: user.id,
      githubId: user.github_id,
      username: user.username,
    });

    console.log("[auth/callback] success — user:", user.username, "redirecting to:", config.appUrl);
    return c.redirect(config.appUrl);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return c.redirect(`${config.appUrl}?auth_error=callback_failed`);
  }
});

authRouter.get("/me", async (c) => {
  const token = getCookie(c, "klipperforge_session");
  console.log("[auth/me] cookie present:", !!token, "cookie length:", token?.length ?? 0);
  if (!token) {
    return c.json({ user: null }, 200);
  }

  try {
    const payload = await verify(token, config.sessionSecret, "HS256");
    console.log("[auth/me] verified user:", payload.username);
    return c.json({
      user: {
        userId: payload.userId,
        githubId: payload.githubId,
        username: payload.username,
      },
    });
  } catch (err) {
    console.error("[auth/me] verify failed:", err);
    clearSessionCookie(c);
    return c.json({ user: null }, 200);
  }
});

authRouter.post("/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});
