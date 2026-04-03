import { getRequestListener } from "@hono/node-server";
import { Hono } from "hono";
import next from "next";
import { createServer } from "node:http";
import { parse } from "node:url";
import { reportRoute } from "@/server/routes/report";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";

async function bootstrap() {
  const app = next({
    dev,
    dir: process.cwd(),
    hostname: "0.0.0.0",
    port
  });
  const handle = app.getRequestHandler();

  await app.prepare();

  const hono = new Hono();
  const honoListener = getRequestListener(hono.fetch);

  hono.get("/api/report", reportRoute);

  createServer((req, res) => {
    if (req.url?.startsWith("/api/")) {
      void honoListener(req, res);
      return;
    }

    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  }).listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
