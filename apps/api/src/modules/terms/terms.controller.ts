import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createTermSchema,
  updateTermSchema,
  type CreateTermInput,
  type UpdateTermInput,
} from "@shared/schemas";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { TermsService } from "./terms.service";

@Controller({ path: "terms", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get()
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  list() {
    return this.termsService.list();
  }

  @Get("active")
  @Roles("SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM")
  active() {
    return this.termsService.getActiveTerm();
  }

  @Post()
  @Roles("SUPERADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createTermSchema)) payload: CreateTermInput) {
    return this.termsService.create(payload);
  }

  @Patch(":id")
  @Roles("SUPERADMIN", "ADMIN")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTermSchema)) payload: UpdateTermInput
  ) {
    return this.termsService.update(id, payload);
  }

  @Delete(":id")
  @Roles("SUPERADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.termsService.remove(id);
  }
}
