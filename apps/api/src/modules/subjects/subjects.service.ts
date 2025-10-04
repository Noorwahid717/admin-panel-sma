import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, ilike, lt } from "drizzle-orm";
import type { CreateSubjectInput, SubjectQuery, UpdateSubjectInput } from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "@shared/db/client";
import { subjects } from "@shared/db/schema";
import { nanoid } from "nanoid";

@Injectable()
export class SubjectsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list(query: SubjectQuery) {
    const limit = query.limit ?? 20;
    const conditions = [];

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      conditions.push(ilike(subjects.name, term));
    }

    if (query.cursor) {
      conditions.push(lt(subjects.createdAt, new Date(query.cursor)));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await this.db
      .select()
      .from(subjects)
      .where(whereClause)
      .orderBy(desc(subjects.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = rows.slice(0, limit);

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.createdAt?.toISOString() : undefined,
    };
  }

  async findById(id: string) {
    const subject = await this.db.query.subjects.findFirst({ where: eq(subjects.id, id) });
    if (!subject) {
      throw new NotFoundException("Subject not found");
    }
    return subject;
  }

  async create(payload: CreateSubjectInput) {
    const [created] = await this.db
      .insert(subjects)
      .values({
        id: nanoid(),
        code: payload.code,
        name: payload.name,
      })
      .returning();
    return created;
  }

  async update(id: string, payload: UpdateSubjectInput) {
    await this.findById(id);
    const [updated] = await this.db
      .update(subjects)
      .set({
        code: payload.code ?? undefined,
        name: payload.name ?? undefined,
      })
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.db.delete(subjects).where(eq(subjects.id, id));
    return { id };
  }
}
