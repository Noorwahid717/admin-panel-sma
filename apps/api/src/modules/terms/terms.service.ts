import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { CreateTermInput, UpdateTermInput } from "@shared/schemas";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import { terms } from "../../db/schema";
import { nanoid } from "nanoid";

@Injectable()
export class TermsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  async list() {
    return this.db.select().from(terms).orderBy(desc(terms.active), asc(terms.startDate));
  }

  async findById(id: string) {
    const term = await this.db.query.terms.findFirst({ where: eq(terms.id, id) });
    if (!term) {
      throw new NotFoundException("Term not found");
    }
    return term;
  }

  private async deactivateOthers(transaction: Database) {
    await transaction
      .update(terms)
      .set({ active: false })
      .where(sql`true`);
  }

  async create(payload: CreateTermInput) {
    return this.db.transaction(async (tx) => {
      if (payload.active) {
        await this.deactivateOthers(tx);
      }

      const [created] = await tx
        .insert(terms)
        .values({
          id: nanoid(),
          name: payload.name,
          startDate: payload.startDate,
          endDate: payload.endDate,
          active: payload.active ?? false,
        })
        .returning();

      return created;
    });
  }

  async update(id: string, payload: UpdateTermInput) {
    return this.db.transaction(async (tx) => {
      const existing = await tx.query.terms.findFirst({ where: eq(terms.id, id) });
      if (!existing) {
        throw new NotFoundException("Term not found");
      }

      if (payload.active) {
        await this.deactivateOthers(tx);
      }

      const [updated] = await tx
        .update(terms)
        .set({
          name: payload.name ?? existing.name,
          startDate: payload.startDate ?? existing.startDate,
          endDate: payload.endDate ?? existing.endDate,
          active: payload.active ?? existing.active,
        })
        .where(eq(terms.id, id))
        .returning();

      return updated;
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.db.delete(terms).where(eq(terms.id, id));
    return { id };
  }

  async getActiveTerm() {
    return this.db.query.terms.findFirst({ where: eq(terms.active, true) });
  }
}
