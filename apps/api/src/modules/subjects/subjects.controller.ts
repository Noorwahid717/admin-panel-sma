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
  createSubjectSchema,
  subjectQuerySchema,
  updateSubjectSchema,
  type CreateSubjectInput,
  type SubjectQuery,
  type UpdateSubjectInput,
} from "../../../../shared/src/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { SubjectsService } from "./subjects.service";

@Controller({ path: "subjects", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  list(@Query(new ZodValidationPipe(subjectQuerySchema)) query: SubjectQuery) {
    return this.subjectsService.list(query);
  }

  @Get(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER")
  get(@Param("id") id: string) {
    return this.subjectsService.findById(id);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  create(@Body(new ZodValidationPipe(createSubjectSchema)) payload: CreateSubjectInput) {
    return this.subjectsService.create(payload);
  }

  @Patch(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSubjectSchema)) payload: UpdateSubjectInput
  ) {
    return this.subjectsService.update(id, payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.subjectsService.remove(id);
  }
}
