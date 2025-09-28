import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestUser } from "@api/auth/auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser | undefined;
  }
);
