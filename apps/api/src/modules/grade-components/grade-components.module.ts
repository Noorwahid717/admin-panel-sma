import { Module } from "@nestjs/common";
import { GradeComponentsService } from "./grade-components.service";
import { GradeComponentsController } from "./grade-components.controller";

@Module({
  controllers: [GradeComponentsController],
  providers: [GradeComponentsService],
  exports: [GradeComponentsService],
})
export class GradeComponentsModule {}
