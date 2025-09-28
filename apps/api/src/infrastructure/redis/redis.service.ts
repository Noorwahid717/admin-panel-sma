import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  get client() {
    return this.redis;
  }

  async onModuleDestroy() {
    if (this.redis.status !== "end") {
      await this.redis.quit();
    }
  }
}
