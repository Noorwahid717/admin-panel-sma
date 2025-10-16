import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { and, between, eq, gte, lte, sql } from "drizzle-orm";
import {
  attendanceQuerySchema,
  bulkAttendanceSchema,
  createAttendanceRecordSchema,
  AttendanceQueryInput,
  BulkAttendanceInput,
  CreateAttendanceRecordInput,
} from "@shared/schemas";
import type { Database } from "@shared/db/client";
import { attendance, classes, enrollments, students, subjects, terms } from "@shared/db/schema";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import { nanoid } from "nanoid";
import type { RequestUser } from "@api/auth/auth.types";
import { OwnershipService } from "../../common/services/ownership.service";

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: Database,
    private readonly ownershipService: OwnershipService
  ) {}

  private async ensureEnrollmentAccess(user: RequestUser, enrollmentId: string) {
    const canAccess = await this.ownershipService.canAccessEnrollment(user, enrollmentId);
    if (!canAccess) {
      throw new UnauthorizedException("Forbidden");
    }
  }

  async upsertRecord(user: RequestUser, payload: CreateAttendanceRecordInput) {
    await this.ensureEnrollmentAccess(user, payload.enrollmentId);

    const [record] = await this.db
      .insert(attendance)
      .values({
        id: nanoid(),
        enrollmentId: payload.enrollmentId,
        date: payload.date,
        sessionType: payload.sessionType,
        status: payload.status,
        subjectId: payload.subjectId ?? null,
        teacherId: user.teacherId ?? null,
      })
      .onConflictDoUpdate({
        target: [
          attendance.enrollmentId,
          attendance.date,
          attendance.sessionType,
          attendance.subjectId,
        ],
        set: { status: payload.status, teacherId: user.teacherId ?? null },
      })
      .returning();

    return record;
  }

  async bulkUpsert(user: RequestUser, payload: BulkAttendanceInput) {
    const canAccessClass = await this.ownershipService.canAccessClass(user, payload.classId);
    if (!canAccessClass) {
      throw new UnauthorizedException("Forbidden");
    }

    await Promise.all(
      payload.records.map((record) => this.ensureEnrollmentAccess(user, record.enrollmentId))
    );

    const values = payload.records.map((record) => ({
      id: nanoid(),
      enrollmentId: record.enrollmentId,
      date: new Date(record.date),
      sessionType: record.sessionType,
      status: record.status,
      subjectId: record.subjectId ?? null,
      teacherId: user.teacherId ?? null,
    }));

    await this.db
      .insert(attendance)
      .values(values)
      .onConflictDoUpdate({
        target: [
          attendance.enrollmentId,
          attendance.date,
          attendance.sessionType,
          attendance.subjectId,
        ],
        set: {
          status: sql`excluded.status`,
          teacherId: sql`excluded.teacher_id`,
        },
      });

    return { updated: values.length };
  }

  async list(query: AttendanceQueryInput) {
    const conditions = [];

    if (query.classId) {
      conditions.push(eq(enrollments.classId, query.classId));
    }

    if (query.termId) {
      conditions.push(eq(enrollments.termId, query.termId));
    }

    if (query.date) {
      conditions.push(eq(attendance.date, query.date));
    }

    if (query.from && query.to) {
      conditions.push(between(attendance.date, query.from, query.to));
    } else if (query.from) {
      conditions.push(gte(attendance.date, query.from));
    } else if (query.to) {
      conditions.push(lte(attendance.date, query.to));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    return this.db
      .select({
        record: attendance,
        student: students,
        subject: subjects,
        enrollment: enrollments,
        class: classes,
        term: terms,
      })
      .from(attendance)
      .innerJoin(enrollments, eq(attendance.enrollmentId, enrollments.id))
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(subjects, eq(attendance.subjectId, subjects.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(terms, eq(enrollments.termId, terms.id))
      .where(whereClause)
      .orderBy(attendance.date);
  }

  async summary(query: AttendanceQueryInput) {
    if (!query.classId) {
      throw new Error("classId is required");
    }

    const baseDate = query.date ?? new Date();
    const from = query.from ?? baseDate;
    const to = query.to ?? baseDate;

    const filters = [eq(enrollments.classId, query.classId), between(attendance.date, from, to)];

    if (query.termId) {
      filters.push(eq(enrollments.termId, query.termId));
    }

    const rows = await this.db
      .select({
        status: attendance.status,
        count: sql<number>`count(*)`,
      })
      .from(attendance)
      .innerJoin(enrollments, eq(attendance.enrollmentId, enrollments.id))
      .where(filters.length === 1 ? filters[0] : and(...filters))
      .groupBy(attendance.status);

    const total = rows.reduce((acc, row) => acc + row.count, 0);

    return {
      range: {
        from,
        to,
      },
      total,
      breakdown: rows,
    };
  }
}
