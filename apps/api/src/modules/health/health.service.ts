import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { performance } from "node:perf_hooks";
import { RedisService } from "../../infrastructure/redis/redis.service";

export interface HealthMetric {
  status: "up" | "down";
  latencyMs: number;
  error?: string;
}

export interface HealthSnapshot {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  startedAt: string;
  checks: {
    database: HealthMetric;
    redis: HealthMetric;
  };
}

@Injectable()
export class HealthService {
  private readonly startedAt = new Date();

  constructor(
    @Inject(Pool) private readonly pool: Pool,
    private readonly redisService: RedisService
  ) {}

  async getHealth(): Promise<HealthSnapshot> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const healthy = database.status === "up" && redis.status === "up";

    return {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: this.startedAt.toISOString(),
      checks: {
        database,
        redis,
      },
    };
  }

  private async checkDatabase(): Promise<HealthMetric> {
    const start = performance.now();

    try {
      await this.pool.query("select 1");
      return { status: "up", latencyMs: performance.now() - start };
    } catch (error) {
      const latencyMs = performance.now() - start;
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      return {
        status: "down",
        latencyMs,
        error: message,
      };
    }
  }

  private async checkRedis(): Promise<HealthMetric> {
    const start = performance.now();

    try {
      await this.redisService.client.ping();
      return { status: "up", latencyMs: performance.now() - start };
    } catch (error) {
      const latencyMs = performance.now() - start;
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      return {
        status: "down",
        latencyMs,
        error: message,
      };
    }
  }
}
