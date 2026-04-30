import type { Context } from "hono";
import { searchUSSecurities } from "@/server/report/longbridge";

export async function securitiesRoute(c: Context) {
  try {
    const query = c.req.query("q") ?? "";
    const results = await searchUSSecurities(query);
    return c.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load US securities";
    return c.json({ error: message }, 502);
  }
}
