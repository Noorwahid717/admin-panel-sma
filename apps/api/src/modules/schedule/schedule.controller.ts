import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  createScheduleEntrySchema,
  scheduleQuerySchema,
  updateScheduleEntrySchema,
  type CreateScheduleEntryInput,
  type ScheduleQueryInput,
  type UpdateScheduleEntryInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Ownership } from "../../common/decorators/ownership.decorator";
import { OwnershipGuard } from "../../common/guards/ownership.guard";
import { ScheduleService } from "./schedule.service";

@Controller({ path: "schedule", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  list(@Query(new ZodValidationPipe(scheduleQuerySchema)) query: ScheduleQueryInput) {
    return this.scheduleService.list(query);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  create(
    @Body(new ZodValidationPipe(createScheduleEntrySchema)) payload: CreateScheduleEntryInput
  ) {
    return this.scheduleService.create(payload);
  }

  @Patch(":id")
  @UseGuards(OwnershipGuard)
  @Ownership("class", "classId")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateScheduleEntrySchema)) payload: UpdateScheduleEntryInput
  ) {
    return this.scheduleService.update(id, payload);
  }

  @Delete(":id")
  @UseGuards(OwnershipGuard)
  @Ownership("class", "classId")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  remove(@Param("id") id: string) {
    return this.scheduleService.remove(id);
  }
}
