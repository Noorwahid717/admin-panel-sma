import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { DRIZZLE_CLIENT } from "./database.constants";
import { createDatabasePool, createDbClient } from "../../db/client";
import type { EnvironmentVariables } from "../../config/env.validation";

@Global()
@Module({
  providers: [
    {
      provide: Pool,
      useFactory: (configService: ConfigService<EnvironmentVariables>) => {
        const connectionString = configService.getOrThrow("DATABASE_URL", { infer: true });
        return createDatabasePool(connectionString);
      },
      inject: [ConfigService],
    },
    {
      provide: DRIZZLE_CLIENT,
      useFactory: (pool: Pool) => createDbClient(pool),
      inject: [Pool],
    },
  ],
  exports: [Pool, DRIZZLE_CLIENT],
})
export class DatabaseModule {}
