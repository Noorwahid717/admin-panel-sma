import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "./schema.js";
export const createDatabasePool = (connectionString) => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({ connectionString, max: 10 });
};
export const createDbClient = (pool) => drizzle(pool, { schema });
