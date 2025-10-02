import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { storagePresignSchema, type StoragePresignInput } from "@shared/schemas";
import { StorageService } from "./storage.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "@api/auth/auth.types";

@Controller({ path: "storage", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
export class StorageController {
  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  @Post("presign")
  @Throttle({
    default: {
      limit: 20,
      ttl: 60_000,
    },
  })
  async presign(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(storagePresignSchema)) payload: StoragePresignInput
  ) {
    return this.storageService.presign(user, payload);
  }
}
