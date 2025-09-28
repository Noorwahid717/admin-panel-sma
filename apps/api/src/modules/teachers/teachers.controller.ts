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
  createTeacherSchema,
  teacherQuerySchema,
  updateTeacherSchema,
  type CreateTeacherInput,
  type TeacherQuery,
  type UpdateTeacherInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { TeachersService } from "./teachers.service";

@Controller({ path: "teachers", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  list(@Query(new ZodValidationPipe(teacherQuerySchema)) query: TeacherQuery) {
    return this.teachersService.list(query);
  }

  @Get(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  get(@Param("id") id: string) {
    return this.teachersService.findById(id);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createTeacherSchema)) payload: CreateTeacherInput) {
    return this.teachersService.create(payload);
  }

  @Patch(":id")
  @Roles("SUPERADMIN", "ADMIN")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTeacherSchema)) payload: UpdateTeacherInput
  ) {
    return this.teachersService.update(id, payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.teachersService.remove(id);
  }
}
