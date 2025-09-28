import { Global, Module } from "@nestjs/common";
import { Queue } from "bullmq";
import { RedisService } from "../redis/redis.service";
import { NOTIFY_EMAIL_QUEUE, REPORT_PDF_QUEUE } from "./queue.constants";

@Global()
@Module({
  providers: [
    {
      provide: REPORT_PDF_QUEUE,
      useFactory: (redisService: RedisService) =>
        new Queue(REPORT_PDF_QUEUE, {
          connection: redisService.client.duplicate(),
        }),
      inject: [RedisService],
    },
    {
      provide: NOTIFY_EMAIL_QUEUE,
      useFactory: (redisService: RedisService) =>
        new Queue(NOTIFY_EMAIL_QUEUE, {
          connection: redisService.client.duplicate(),
        }),
      inject: [RedisService],
    },
  ],
  exports: [REPORT_PDF_QUEUE, NOTIFY_EMAIL_QUEUE],
})
export class QueueModule {}
