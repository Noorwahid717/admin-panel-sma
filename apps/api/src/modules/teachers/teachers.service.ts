import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, ilike, lt } from "drizzle-orm";
import type { CreateTeacherInput, TeacherQuery, UpdateTeacherInput } from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "@shared/db/client";
import { teachers } from "@shared/db/schema";
import { nanoid } from "nanoid";

@Injectable()
export class TeachersService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list(query: TeacherQuery) {
    const limit = query.limit ?? 20;
    const conditions = [];

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      conditions.push(ilike(teachers.fullName, term));
    }

    if (query.cursor) {
      conditions.push(lt(teachers.createdAt, new Date(query.cursor)));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await this.db
      .select()
      .from(teachers)
      .where(whereClause)
      .orderBy(desc(teachers.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = rows.slice(0, limit);

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.createdAt?.toISOString() : undefined,
    };
  }

  async findById(id: string) {
    const teacher = await this.db.query.teachers.findFirst({ where: eq(teachers.id, id) });
    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    return teacher;
  }

  async create(payload: CreateTeacherInput) {
    const [created] = await this.db
      .insert(teachers)
      .values({
        id: nanoid(),
        nip: payload.nip ?? null,
        fullName: payload.fullName,
      })
      .returning();
    return created;
  }

  async update(id: string, payload: UpdateTeacherInput) {
    await this.findById(id);
    const [updated] = await this.db
      .update(teachers)
      .set({
        nip: payload.nip ?? null,
        fullName: payload.fullName ?? undefined,
      })
      .where(eq(teachers.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.db.delete(teachers).where(eq(teachers.id, id));
    return { id };
  }
}
