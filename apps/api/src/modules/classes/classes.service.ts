import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, desc, eq, ilike, lt } from "drizzle-orm";
import type { ClassQuery, CreateClassInput, UpdateClassInput } from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import {
  classes,
  enrollments,
  scheduleEntries,
  students,
  subjects,
  teachers,
  terms,
} from "../../db/schema";
import { nanoid } from "nanoid";

@Injectable()
export class ClassesService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list(query: ClassQuery) {
    const limit = query.limit ?? 20;
    const conditions = [];

    if (query.level) {
      conditions.push(eq(classes.level, query.level));
    }

    if (query.homeroomId) {
      conditions.push(eq(classes.homeroomId, query.homeroomId));
    }

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      conditions.push(ilike(classes.name, term));
    }

    if (query.cursor) {
      conditions.push(lt(classes.createdAt, new Date(query.cursor)));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await this.db
      .select()
      .from(classes)
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = rows.slice(0, limit);

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.createdAt?.toISOString() : undefined,
    };
  }

  async findById(id: string) {
    const record = await this.db.query.classes.findFirst({ where: eq(classes.id, id) });
    if (!record) {
      throw new NotFoundException("Class not found");
    }
    return record;
  }

  async create(payload: CreateClassInput) {
    const [created] = await this.db
      .insert(classes)
      .values({
        id: nanoid(),
        name: payload.name,
        level: payload.level,
        homeroomId: payload.homeroomId ?? null,
      })
      .returning();
    return created;
  }

  async update(id: string, payload: UpdateClassInput) {
    await this.findById(id);
    const [updated] = await this.db
      .update(classes)
      .set({
        name: payload.name ?? undefined,
        level: payload.level ?? undefined,
        homeroomId: payload.homeroomId ?? null,
      })
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.db.delete(classes).where(eq(classes.id, id));
    return { id };
  }

  async getStudents(classId: string, termId?: string) {
    const classRecord = await this.findById(classId);

    const rows = await this.db
      .select({
        student: students,
        enrollment: enrollments,
        term: terms,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(terms, eq(enrollments.termId, terms.id))
      .where(
        termId
          ? and(eq(enrollments.classId, classId), eq(enrollments.termId, termId))
          : eq(enrollments.classId, classId)
      )
      .orderBy(desc(enrollments.createdAt));

    return {
      class: classRecord,
      students: rows.map((row) => ({
        ...row.student,
        enrollmentId: row.enrollment.id,
        term: row.term,
      })),
    };
  }

  async getSchedule(classId: string) {
    await this.findById(classId);

    const entries = await this.db
      .select({
        schedule: scheduleEntries,
        subject: subjects,
        teacher: teachers,
      })
      .from(scheduleEntries)
      .innerJoin(subjects, eq(scheduleEntries.subjectId, subjects.id))
      .innerJoin(teachers, eq(scheduleEntries.teacherId, teachers.id))
      .where(eq(scheduleEntries.classId, classId))
      .orderBy(asc(scheduleEntries.dayOfWeek), asc(scheduleEntries.startTime));

    return entries.map((entry) => ({
      id: entry.schedule.id,
      dayOfWeek: entry.schedule.dayOfWeek,
      startTime: entry.schedule.startTime,
      endTime: entry.schedule.endTime,
      subject: entry.subject,
      teacher: entry.teacher,
    }));
  }
}
