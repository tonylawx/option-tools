import type { Context } from "hono";
import { searchUSSecurities } from "./report/longbridge";

export async function securitiesRoute(c: Context) {
  const query = c.req.query("q") ?? "";
  const results = await searchUSSecurities(query);
  return c.json(results);
}
