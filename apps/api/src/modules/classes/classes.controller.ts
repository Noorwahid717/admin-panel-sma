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
  classQuerySchema,
  createClassSchema,
  type ClassQuery,
  type CreateClassInput,
  type UpdateClassInput,
  updateClassSchema,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ClassesService } from "./classes.service";
import { Ownership } from "../../common/decorators/ownership.decorator";
import { OwnershipGuard } from "../../common/guards/ownership.guard";

@Controller({ path: "classes", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  list(@Query(new ZodValidationPipe(classQuerySchema)) query: ClassQuery) {
    return this.classesService.list(query);
  }

  @Get(":id")
  @UseGuards(OwnershipGuard)
  @Ownership("class", "id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  get(@Param("id") id: string) {
    return this.classesService.findById(id);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  create(@Body(new ZodValidationPipe(createClassSchema)) payload: CreateClassInput) {
    return this.classesService.create(payload);
  }

  @Patch(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateClassSchema)) payload: UpdateClassInput
  ) {
    return this.classesService.update(id, payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.classesService.remove(id);
  }

  @Get(":id/students")
  @UseGuards(OwnershipGuard)
  @Ownership("class", "id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  getStudents(@Param("id") id: string, @Query("termId") termId?: string) {
    return this.classesService.getStudents(id, termId);
  }

  @Get(":id/schedule")
  @UseGuards(OwnershipGuard)
  @Ownership("class", "id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  getSchedule(@Param("id") id: string) {
    return this.classesService.getSchedule(id);
  }
}
