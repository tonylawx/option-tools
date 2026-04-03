import type { Context } from "hono";
import { searchUSSecurities } from "@/server/report/longport";

export async function searchRoute(c: Context) {
  const query = c.req.query("q") ?? "";
  const results = await searchUSSecurities(query);
  return c.json(results);
}
