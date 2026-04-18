import type { Context } from "hono";
import { buildSellPutReport } from "./report/build-report";
import { normalizeLocale } from "@tonylaw/shared/i18n";

export async function reportRoute(c: Context) {
  const symbol = c.req.query("symbol") ?? "QQQ.US";
  const locale = normalizeLocale(c.req.query("locale"));
  const report = await buildSellPutReport(symbol, locale);
  return c.json(report);
}
