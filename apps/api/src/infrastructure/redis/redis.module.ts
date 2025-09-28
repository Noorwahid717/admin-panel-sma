import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis, { RedisOptions } from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";
import type { EnvironmentVariables } from "../../config/env.validation";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService<EnvironmentVariables>) => {
        const redisUrl = configService.getOrThrow("REDIS_URL", { infer: true });
        const options: RedisOptions = {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        };
        return new Redis(redisUrl, options);
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
