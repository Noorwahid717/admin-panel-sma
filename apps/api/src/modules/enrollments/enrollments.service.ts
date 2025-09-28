import { Inject, Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import type { BulkEnrollmentInput, CreateEnrollmentInput } from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import { enrollments } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

@Injectable()
export class EnrollmentsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async create(payload: CreateEnrollmentInput) {
    try {
      const [created] = await this.db
        .insert(enrollments)
        .values({
          id: nanoid(),
          studentId: payload.studentId,
          classId: payload.classId,
          termId: payload.termId,
        })
        .returning();
      return created;
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new ConflictException("Enrollment already exists");
      }
      throw error;
    }
  }

  async bulkCreate(payload: BulkEnrollmentInput) {
    const values = payload.enrollments.map((item) => ({
      id: nanoid(),
      studentId: item.studentId,
      classId: item.classId,
      termId: item.termId,
    }));

    await this.db.insert(enrollments).values(values).onConflictDoNothing();

    return { inserted: values.length };
  }

  async remove(id: string) {
    const existing = await this.db.query.enrollments.findFirst({ where: eq(enrollments.id, id) });
    if (!existing) {
      throw new NotFoundException("Enrollment not found");
    }
    await this.db.delete(enrollments).where(eq(enrollments.id, id));
    return { id };
  }
}
