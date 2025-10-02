import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  loginSchema,
  refreshSchema,
  registerUserSchema,
  logoutSchema,
  type LoginInput,
  type RefreshInput,
  type RegisterUserInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "@api/auth/auth.types";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Throttle(5, 60)
  @Post("login")
  login(@Req() request: Request, @Body(new ZodValidationPipe(loginSchema)) payload: LoginInput) {
    return this.authService.login(payload, request);
  }

  @Public()
  @Throttle(5, 60)
  @Post("refresh")
  refresh(
    @Req() request: Request,
    @Body(new ZodValidationPipe(refreshSchema)) payload: RefreshInput
  ) {
    return this.authService.refresh(payload, request);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  logout(@Req() request: Request, @CurrentUser() user: RequestUser, @Body() rawBody: unknown) {
    const body = rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {};

    const query = request.query ?? {};
    const queryJti =
      typeof query.jti === "string"
        ? query.jti
        : Array.isArray(query.jti)
          ? query.jti[0]
          : undefined;
    const queryAllValue = Array.isArray(query.all) ? query.all[0] : query.all;
    const queryAll = typeof queryAllValue === "string" ? queryAllValue === "true" : undefined;

    const merged = {
      ...body,
      jti: body.jti ?? queryJti,
      all: body.all ?? queryAll,
    };

    const payload = logoutSchema.parse(merged);
    return this.authService.logout(user, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPERADMIN")
  @Post("register")
  register(
    @Req() request: Request,
    @Body(new ZodValidationPipe(registerUserSchema)) payload: RegisterUserInput
  ) {
    return this.authService.register(payload, request);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }
}
