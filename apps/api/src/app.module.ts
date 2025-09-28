import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { environmentSchema, validateEnvironment } from "./config/env.validation";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { QueueModule } from "./infrastructure/queue/queue.module";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StudentsModule } from "./modules/students/students.module";
import { TeachersModule } from "./modules/teachers/teachers.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { TermsModule } from "./modules/terms/terms.module";
import { EnrollmentsModule } from "./modules/enrollments/enrollments.module";
import { ScheduleModule } from "./modules/schedule/schedule.module";
import { GradeComponentsModule } from "./modules/grade-components/grade-components.module";
import { GradesModule } from "./modules/grades/grades.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { StorageModule } from "./modules/storage/storage.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { OwnershipGuard } from "./common/guards/ownership.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      expandVariables: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    CommonModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    SubjectsModule,
    TermsModule,
    EnrollmentsModule,
    ScheduleModule,
    GradeComponentsModule,
    GradesModule,
    AttendanceModule,
    ReportsModule,
    StorageModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: OwnershipGuard },
  ],
})
export class AppModule {}
