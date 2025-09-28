import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import type {
  CreateScheduleEntryInput,
  ScheduleQueryInput,
  UpdateScheduleEntryInput,
} from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import { classes, scheduleEntries, subjects, teachers } from "../../db/schema";
import { nanoid } from "nanoid";

@Injectable()
export class ScheduleService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list(query: ScheduleQueryInput) {
    const conditions = [];

    if (query.classId) {
      conditions.push(eq(scheduleEntries.classId, query.classId));
    }

    if (query.teacherId) {
      conditions.push(eq(scheduleEntries.teacherId, query.teacherId));
    }

    if (query.subjectId) {
      conditions.push(eq(scheduleEntries.subjectId, query.subjectId));
    }

    if (query.dayOfWeek) {
      conditions.push(eq(scheduleEntries.dayOfWeek, query.dayOfWeek));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    return this.db
      .select({
        schedule: scheduleEntries,
        class: classes,
        subject: subjects,
        teacher: teachers,
      })
      .from(scheduleEntries)
      .innerJoin(classes, eq(scheduleEntries.classId, classes.id))
      .innerJoin(subjects, eq(scheduleEntries.subjectId, subjects.id))
      .innerJoin(teachers, eq(scheduleEntries.teacherId, teachers.id))
      .where(whereClause)
      .orderBy(asc(scheduleEntries.dayOfWeek), asc(scheduleEntries.startTime));
  }

  async findById(id: string) {
    const entry = await this.db.query.scheduleEntries.findFirst({
      where: eq(scheduleEntries.id, id),
    });
    if (!entry) {
      throw new NotFoundException("Schedule entry not found");
    }
    return entry;
  }

  async create(payload: CreateScheduleEntryInput) {
    const [created] = await this.db
      .insert(scheduleEntries)
      .values({
        id: nanoid(),
        classId: payload.classId,
        subjectId: payload.subjectId,
        teacherId: payload.teacherId,
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
        termId: payload.termId ?? null,
      })
      .returning();
    return created;
  }

  async update(id: string, payload: UpdateScheduleEntryInput) {
    await this.findById(id);
    const [updated] = await this.db
      .update(scheduleEntries)
      .set({
        classId: payload.classId ?? undefined,
        subjectId: payload.subjectId ?? undefined,
        teacherId: payload.teacherId ?? undefined,
        dayOfWeek: payload.dayOfWeek ?? undefined,
        startTime: payload.startTime ?? undefined,
        endTime: payload.endTime ?? undefined,
        termId: payload.termId ?? undefined,
      })
      .where(eq(scheduleEntries.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.db.delete(scheduleEntries).where(eq(scheduleEntries.id, id));
    return { id };
  }
}
