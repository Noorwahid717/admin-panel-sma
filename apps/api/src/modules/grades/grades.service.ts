import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { CreateGradeInput, GradeQueryInput } from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import {
  classes,
  enrollments,
  gradeComponents,
  grades,
  students,
  subjects,
  teachers,
} from "../../db/schema";
import { nanoid } from "nanoid";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";
import { OwnershipService } from "../../common/services/ownership.service";

@Injectable()
export class GradesService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: Database,
    private readonly ownershipService: OwnershipService
  ) {}

  async list(query: GradeQueryInput) {
    const conditions = [];

    if (query.studentId) {
      conditions.push(eq(enrollments.studentId, query.studentId));
    }

    if (query.subjectId) {
      conditions.push(eq(grades.subjectId, query.subjectId));
    }

    if (query.termId) {
      conditions.push(eq(gradeComponents.termId, query.termId));
    }

    if (query.classId) {
      conditions.push(eq(enrollments.classId, query.classId));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    return this.db
      .select({
        grade: grades,
        component: gradeComponents,
        enrollment: enrollments,
        student: students,
        subject: subjects,
        teacher: teachers,
        class: classes,
      })
      .from(grades)
      .innerJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(subjects, eq(grades.subjectId, subjects.id))
      .innerJoin(gradeComponents, eq(grades.componentId, gradeComponents.id))
      .leftJoin(teachers, eq(grades.teacherId, teachers.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .where(whereClause)
      .orderBy(gradeComponents.name);
  }

  async upsert(user: AuthenticatedUser, payload: CreateGradeInput) {
    const canAccess = await this.ownershipService.canAccessEnrollment(user, payload.enrollmentId);
    if (!canAccess) {
      throw new UnauthorizedException("Forbidden");
    }

    const teacherId = user.teacherId ?? user.id;

    try {
      const [created] = await this.db
        .insert(grades)
        .values({
          id: nanoid(),
          enrollmentId: payload.enrollmentId,
          subjectId: payload.subjectId,
          componentId: payload.componentId,
          score: payload.score,
          teacherId,
        })
        .onConflictDoUpdate({
          target: [grades.enrollmentId, grades.subjectId, grades.componentId],
          set: { score: payload.score, teacherId },
        })
        .returning();
      return created;
    } catch (error) {
      if ((error as { code?: string }).code === "23503") {
        throw new ConflictException("Invalid enrollment or component reference");
      }
      throw error;
    }
  }
}
