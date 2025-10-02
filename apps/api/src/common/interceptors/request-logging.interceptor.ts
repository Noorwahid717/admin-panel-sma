import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { performance } from "node:perf_hooks";
import { Observable } from "rxjs";
import { tap } from "rxjs";

interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithId>();
    const response = httpContext.getResponse<Response>();

    if (!request || !response) {
      return next.handle();
    }

    const requestId = nanoid(10);
    const method = request.method;
    const url = request.originalUrl ?? request.url ?? "unknown";
    const rawUserAgent = request.headers["user-agent"];
    const userAgent = Array.isArray(rawUserAgent)
      ? rawUserAgent.join(", ")
      : (rawUserAgent ?? "unknown");
    const startTime = performance.now();

    request.requestId = requestId;

    this.logger.log(`[${requestId}] ${method} ${url} - inbound (agent: ${userAgent})`);

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = performance.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `[${requestId}] ${method} ${url} ${statusCode} - ${durationMs.toFixed(1)}ms`
          );
        },
        error: (error: unknown) => {
          const durationMs = performance.now() - startTime;
          const statusCode =
            typeof (error as { status?: number }).status === "number"
              ? (error as { status: number }).status
              : typeof (error as { statusCode?: number }).statusCode === "number"
                ? (error as { statusCode: number }).statusCode
                : 500;

          const message =
            error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "");

          this.logger.error(
            `[${requestId}] ${method} ${url} ${statusCode} - ${durationMs.toFixed(1)}ms :: ${message}`
          );
        },
      })
    );
  }
}
