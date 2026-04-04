import nextEnv from "@next/env";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { reportRoute } from "@/server/routes/report";
import { searchRoute } from "@/server/routes/search";

nextEnv.loadEnvConfig(process.cwd());

const port = Number(
  process.env.API_PORT ??
    (process.env.NODE_ENV === "production" ? process.env.PORT : undefined) ??
    3001
);

async function bootstrap() {
  const hono = new Hono();

  hono.use(
    "*",
    cors({
      origin: (origin) => origin ?? "*",
      allowMethods: ["GET", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"]
    })
  );

  hono.get("/api/report", reportRoute);
  hono.get("/api/search", searchRoute);
  hono.get("/health", (c) => c.json({ ok: true }));

  serve(
    {
      fetch: hono.fetch,
      port
    },
    (info) => {
      console.log(`> Hono API ready on http://localhost:${info.port}`);
    }
  );
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
