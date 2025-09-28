import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  loginSchema,
  refreshSchema,
  registerUserSchema,
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

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body(new ZodValidationPipe(loginSchema)) payload: LoginInput) {
    return this.authService.login(payload);
  }

  @Public()
  @Post("refresh")
  refresh(@Body(new ZodValidationPipe(refreshSchema)) payload: RefreshInput) {
    return this.authService.refresh(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@Body(new ZodValidationPipe(refreshSchema)) payload: RefreshInput) {
    return this.authService.logout(payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPERADMIN")
  @Post("register")
  register(@Body(new ZodValidationPipe(registerUserSchema)) payload: RegisterUserInput) {
    return this.authService.register(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }
}
