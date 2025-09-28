import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  attendanceQuerySchema,
  bulkAttendanceSchema,
  createAttendanceRecordSchema,
  type AttendanceQueryInput,
  type BulkAttendanceInput,
  type CreateAttendanceRecordInput,
} from "@shared/schemas";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "@api/auth/auth.types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { OwnershipGuard } from "../../common/guards/ownership.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller({ path: "attendance", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("bulk")
  async bulkUpsert(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(bulkAttendanceSchema)) payload: BulkAttendanceInput
  ) {
    return this.attendanceService.bulkUpsert(user, payload);
  }

  @Post()
  async upsert(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createAttendanceRecordSchema)) payload: CreateAttendanceRecordInput
  ) {
    return this.attendanceService.upsertRecord(user, payload);
  }

  @Get()
  async list(@Query(new ZodValidationPipe(attendanceQuerySchema)) query: AttendanceQueryInput) {
    return this.attendanceService.list(query);
  }

  @Get("summary")
  async summary(@Query(new ZodValidationPipe(attendanceQuerySchema)) query: AttendanceQueryInput) {
    return this.attendanceService.summary(query);
  }
}
