import type { Pool } from "pg";
import { createDbClient, createDatabasePool, type Database } from "@api/db/client";

let dbInstance: Database | null = null;
let poolInstance: Pool | null = null;

export function getDatabase(): Database {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  poolInstance = createDatabasePool(databaseUrl);
  dbInstance = createDbClient(poolInstance);

  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }

  dbInstance = null;
}
