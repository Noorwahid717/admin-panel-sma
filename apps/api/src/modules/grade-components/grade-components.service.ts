import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type {
  CreateGradeComponentInput,
  GradeQueryInput,
  UpdateGradeComponentInput,
} from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "@shared/db/client";
import { gradeComponents } from "@shared/db/schema";
import { nanoid } from "nanoid";

@Injectable()
export class GradeComponentsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list(query: GradeQueryInput) {
    const conditions = [];

    if (query.subjectId) {
      conditions.push(eq(gradeComponents.subjectId, query.subjectId));
    }

    if (query.termId) {
      conditions.push(eq(gradeComponents.termId, query.termId));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    return this.db.select().from(gradeComponents).where(whereClause).orderBy(gradeComponents.name);
  }

  async create(payload: CreateGradeComponentInput) {
    try {
      const [created] = await this.db
        .insert(gradeComponents)
        .values({
          id: nanoid(),
          name: payload.name,
          weight: payload.weight,
          subjectId: payload.subjectId,
          termId: payload.termId,
        })
        .returning();
      return created;
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new ConflictException("Grade component already exists");
      }
      throw error;
    }
  }

  async update(id: string, payload: UpdateGradeComponentInput) {
    const existing = await this.db.query.gradeComponents.findFirst({
      where: eq(gradeComponents.id, id),
    });
    if (!existing) {
      throw new NotFoundException("Grade component not found");
    }

    const [updated] = await this.db
      .update(gradeComponents)
      .set({
        name: payload.name ?? undefined,
        weight: payload.weight ?? undefined,
      })
      .where(eq(gradeComponents.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const existing = await this.db.query.gradeComponents.findFirst({
      where: eq(gradeComponents.id, id),
    });
    if (!existing) {
      throw new NotFoundException("Grade component not found");
    }
    await this.db.delete(gradeComponents).where(eq(gradeComponents.id, id));
    return { id };
  }
}
