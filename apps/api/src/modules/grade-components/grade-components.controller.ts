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
  createGradeComponentSchema,
  gradeQuerySchema,
  updateGradeComponentSchema,
  type CreateGradeComponentInput,
  type GradeQueryInput,
  type UpdateGradeComponentInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { GradeComponentsService } from "./grade-components.service";

@Controller({ path: "grade-components", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradeComponentsController {
  constructor(private readonly service: GradeComponentsService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  list(@Query(new ZodValidationPipe(gradeQuerySchema)) query: GradeQueryInput) {
    return this.service.list(query);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  create(
    @Body(new ZodValidationPipe(createGradeComponentSchema)) payload: CreateGradeComponentInput
  ) {
    return this.service.create(payload);
  }

  @Patch(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGradeComponentSchema)) payload: UpdateGradeComponentInput
  ) {
    return this.service.update(id, payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
