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
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserQuery,
} from "@shared/schemas";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UsersService } from "./users.service";

@Controller({ path: "users", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPERADMIN", "ADMIN")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(userQuerySchema)) query: UserQuery) {
    return this.usersService.list(query);
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createUserSchema)) payload: CreateUserInput) {
    return this.usersService.create(payload);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) payload: UpdateUserInput
  ) {
    return this.usersService.update(id, payload);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
