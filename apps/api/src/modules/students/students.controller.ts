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
  bulkStudentImportSchema,
  createStudentSchema,
  studentQuerySchema,
  updateStudentSchema,
  type BulkStudentImportInput,
  type CreateStudentInput,
  type StudentQuery,
  type UpdateStudentInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { StudentsService } from "./students.service";

@Controller({ path: "students", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  list(@Query(new ZodValidationPipe(studentQuerySchema)) query: StudentQuery) {
    return this.studentsService.list(query);
  }

  @Get(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  get(@Param("id") id: string) {
    return this.studentsService.findById(id);
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  create(@Body(new ZodValidationPipe(createStudentSchema)) payload: CreateStudentInput) {
    return this.studentsService.create(payload);
  }

  @Patch(":id")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentSchema)) payload: UpdateStudentInput
  ) {
    return this.studentsService.update(id, payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.studentsService.remove(id);
  }

  @Post("/import")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR")
  importBulk(
    @Body(new ZodValidationPipe(bulkStudentImportSchema)) payload: BulkStudentImportInput
  ) {
    return this.studentsService.importBulk(payload);
  }
}
