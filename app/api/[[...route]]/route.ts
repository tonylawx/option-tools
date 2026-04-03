import { Hono } from "hono";
import { handle } from "hono/vercel";
import { buildSellPutReport } from "@/server/report/build-report";
import { searchUSSecurities } from "@/server/report/longport";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

app.get("/report", async (c) => {
  try {
    const symbol = c.req.query("symbol") ?? "TQQQ.US";
    const report = await buildSellPutReport(symbol);
    return c.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return c.json({ error: message }, 502);
  }
});

app.get("/search", async (c) => {
  try {
    const query = c.req.query("q") ?? "";
    const results = await searchUSSecurities(query);
    return c.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return c.json({ error: message }, 502);
  }
});

export const GET = handle(app);
