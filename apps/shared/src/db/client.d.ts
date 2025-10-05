import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
export declare const createDatabasePool: (connectionString: string) => Pool;
export type Database = NodePgDatabase<typeof schema>;
export declare const createDbClient: (pool: Pool) => Database;
//# sourceMappingURL=client.d.ts.map
