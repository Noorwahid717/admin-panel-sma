import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { reportRequestSchema, type ReportRequestInput } from "@shared/schemas";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { OwnershipGuard } from "../../common/guards/ownership.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Ownership } from "../../common/decorators/ownership.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";

@Controller({ path: "reports", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  async list(@CurrentUser() user: AuthenticatedUser, @Query("status") status?: string) {
    return this.reportsService.list(user, status);
  }

  @Get(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  async findById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.reportsService.findById(user, id);
  }

  @Get("enrollment/:enrollmentId")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  @Ownership("enrollment", "enrollmentId")
  async findByEnrollment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("enrollmentId") enrollmentId: string
  ) {
    return this.reportsService.findByEnrollment(user, enrollmentId);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  @Ownership("enrollment", "enrollmentId")
  async requestReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(reportRequestSchema)) payload: ReportRequestInput
  ) {
    return this.reportsService.request(user, payload);
  }
}
