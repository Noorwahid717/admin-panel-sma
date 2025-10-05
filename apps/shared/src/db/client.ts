import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export const createDatabasePool = (connectionString: string) => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({ connectionString, max: 10 });
};

export type Database = NodePgDatabase<typeof schema>;

export const createDbClient = (pool: Pool): Database => drizzle(pool, { schema });
