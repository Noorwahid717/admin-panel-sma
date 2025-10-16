import type { NodePgDatabase } from "drizzle-orm/node-postgres";
declare const Pool: typeof import("pg").Pool;
import * as schema from "./schema.js";
export declare const createDatabasePool: (connectionString: string) => import("pg").Pool;
export type Database = NodePgDatabase<typeof schema>;
export declare const createDbClient: (pool: InstanceType<typeof Pool>) => Database;
export {};
