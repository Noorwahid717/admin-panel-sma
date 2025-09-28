import { Body, Controller, Delete, Param, Post, UseGuards } from "@nestjs/common";
import {
  bulkEnrollmentSchema,
  createEnrollmentSchema,
  type BulkEnrollmentInput,
  type CreateEnrollmentInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { EnrollmentsService } from "./enrollments.service";

@Controller({ path: "enrollments", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  create(@Body(new ZodValidationPipe(createEnrollmentSchema)) payload: CreateEnrollmentInput) {
    return this.enrollmentsService.create(payload);
  }

  @Post("bulk")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  bulk(@Body(new ZodValidationPipe(bulkEnrollmentSchema)) payload: BulkEnrollmentInput) {
    return this.enrollmentsService.bulkCreate(payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.enrollmentsService.remove(id);
  }
}
