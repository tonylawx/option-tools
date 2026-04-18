import type { Context, Next } from "hono";
import { getSessionUserFromCookieHeader } from "../auth/user-store";

export async function requireSharedApiAuth(c: Context, next: Next) {
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV !== "production") {
    await next();
    return;
  }

  const token = await getSessionUserFromCookieHeader(c.req.header("cookie"));

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}
