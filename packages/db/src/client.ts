import postgres from "postgres";

let sqlInstance: postgres.Sql | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (!sqlInstance) {
    sqlInstance = postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false
    });
  }

  return sqlInstance;
}
