import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, ilike, lt, sql } from "drizzle-orm";
import type {
  BulkStudentImportInput,
  CreateStudentInput,
  StudentQuery,
  UpdateStudentInput,
} from "@shared/schemas";
import type { Database } from "@shared/db/client";
import { students, enrollments } from "@shared/db/schema";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import { nanoid } from "nanoid";

@Injectable()
export class StudentsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list(query: StudentQuery) {
    const limit = query.limit ?? 20;
    const conditions = [];

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      conditions.push(ilike(students.fullName, term));
    }

    if (query.cursor) {
      conditions.push(lt(students.createdAt, new Date(query.cursor)));
    }

    if (query.classId) {
      if (query.termId) {
        conditions.push(
          sql`exists (select 1 from ${enrollments} e where e.student_id = ${students.id} and e.class_id = ${query.classId} and e.term_id = ${query.termId})`
        );
      } else {
        conditions.push(
          sql`exists (select 1 from ${enrollments} e where e.student_id = ${students.id} and e.class_id = ${query.classId})`
        );
      }
    } else if (query.termId) {
      conditions.push(
        sql`exists (select 1 from ${enrollments} e where e.student_id = ${students.id} and e.term_id = ${query.termId})`
      );
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await this.db
      .select()
      .from(students)
      .where(whereClause)
      .orderBy(desc(students.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = rows.slice(0, limit);

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.createdAt?.toISOString() : undefined,
    };
  }

  async findById(id: string) {
    const student = await this.db.query.students.findFirst({ where: eq(students.id, id) });
    if (!student) {
      throw new NotFoundException("Student not found");
    }
    return student;
  }

  async create(payload: CreateStudentInput) {
    const id = nanoid();
    const [created] = await this.db
      .insert(students)
      .values({
        id,
        nis: payload.nis,
        fullName: payload.fullName,
        birthDate: payload.birthDate,
        gender: payload.gender,
        guardian: payload.guardian ?? null,
      })
      .returning();
    return created;
  }

  async update(id: string, payload: UpdateStudentInput) {
    await this.findById(id);
    const [updated] = await this.db
      .update(students)
      .set({
        ...payload,
        guardian: payload.guardian ?? null,
      })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.db.delete(students).where(eq(students.id, id));
    return { id };
  }

  async importBulk(payload: BulkStudentImportInput) {
    const values = payload.students.map((student) => ({
      id: nanoid(),
      nis: student.nis,
      fullName: student.fullName,
      birthDate: new Date(student.birthDate),
      gender: student.gender,
      guardian: student.guardian ?? null,
    }));

    await this.db.insert(students).values(values).onConflictDoNothing({ target: students.nis });

    return { inserted: values.length };
  }
}
