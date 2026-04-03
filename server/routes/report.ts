import type { Context } from "hono";
import { buildSellPutReport } from "@/server/report/build-report";

export async function reportRoute(c: Context) {
  const symbol = c.req.query("symbol") ?? "QQQ.US";
  const report = await buildSellPutReport(symbol);
  return c.json(report);
}
