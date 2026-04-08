import postgres from "postgres";

let sqlInstance: postgres.Sql | null = null;

function shouldUseSsl(databaseUrl: string) {
  if (process.env.DATABASE_SSL === "disable") {
    return false;
  }

  if (process.env.DATABASE_SSL === "require") {
    return true;
  }

  try {
    const url = new URL(databaseUrl);
    return url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (!sqlInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    sqlInstance = postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
      ssl: shouldUseSsl(databaseUrl) ? "require" : undefined
    });
  }

  return sqlInstance;
}
