import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  createGradeSchema,
  gradeQuerySchema,
  type CreateGradeInput,
  type GradeQueryInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { GradesService } from "./grades.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "@api/auth/auth.types";

@Controller({ path: "grades", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  list(@Query(new ZodValidationPipe(gradeQuerySchema)) query: GradeQueryInput) {
    return this.gradesService.list(query);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createGradeSchema)) payload: CreateGradeInput
  ) {
    return this.gradesService.upsert(user, payload);
  }
}
