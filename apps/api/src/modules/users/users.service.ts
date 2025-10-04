import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { and, desc, eq, ilike, lt, sql } from "drizzle-orm";
import * as argon2 from "argon2";
import type { CreateUserInput, UpdateUserInput, UserQuery } from "@shared/schemas";
import { ROLES } from "@shared/constants";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "@shared/db/client";
import { users } from "@shared/db/schema";
import { nanoid } from "nanoid";
import type { EnvironmentVariables } from "../../config/env.validation";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: Database,
    @Inject(ConfigService) private readonly configService: ConfigService<EnvironmentVariables>
  ) {}

  private getConfigNumber(key: keyof EnvironmentVariables, fallback: number) {
    const value = this.configService?.get(key, { infer: true });
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const fromEnv = process.env[key as string];
    const parsed = fromEnv ? Number(fromEnv) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private get argonMemoryCost() {
    return this.getConfigNumber("ARGON2_MEMORY_COST", 19456);
  }

  private get argonTimeCost() {
    return this.getConfigNumber("ARGON2_TIME_COST", 2);
  }

  private async hashPassword(plain: string) {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: this.argonMemoryCost,
      timeCost: this.argonTimeCost,
    });
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
  }

  async findById(id: string) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async list(query: UserQuery) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor;

    const conditions = [];

    if (query.role) {
      conditions.push(eq(users.role, query.role));
    }

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      conditions.push(ilike(users.fullName, term));
    }

    if (cursor) {
      conditions.push(lt(users.createdAt, new Date(cursor)));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await this.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = rows.slice(0, limit);
    const nextCursor = hasNextPage ? items[items.length - 1]?.createdAt?.toISOString() : undefined;

    return {
      items,
      nextCursor,
    };
  }

  async create(payload: CreateUserInput) {
    if (!ROLES.includes(payload.role)) {
      throw new Error("Invalid role");
    }

    const passwordHash = await this.hashPassword(payload.password);
    const id = nanoid();

    const [created] = await this.db
      .insert(users)
      .values({
        id,
        email: payload.email.toLowerCase(),
        password: passwordHash,
        fullName: payload.fullName,
        role: payload.role,
        teacherId: payload.teacherId ?? null,
        studentId: payload.studentId ?? null,
      })
      .returning();

    return created;
  }

  async update(id: string, payload: UpdateUserInput) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const values: Partial<typeof existing> = {};

    if (payload.fullName) {
      values.fullName = payload.fullName;
    }

    if (payload.role) {
      if (!ROLES.includes(payload.role)) {
        throw new Error("Invalid role");
      }
      values.role = payload.role;
    }

    if (payload.teacherId !== undefined) {
      values.teacherId = payload.teacherId;
    }

    if (payload.studentId !== undefined) {
      values.studentId = payload.studentId;
    }

    const [updated] = await this.db.update(users).set(values).where(eq(users.id, id)).returning();

    return updated;
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.db.delete(users).where(eq(users.id, id));

    return { id };
  }

  async ensureAdminExists() {
    const count = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "SUPERADMIN"))
      .limit(1);

    if (Number(count[0]?.count ?? 0) > 0) {
      return;
    }

    const passwordHash = await this.hashPassword("SmaAdmin123!@#");

    await this.db.insert(users).values({
      id: nanoid(),
      email: "superadmin@example.sch.id",
      password: passwordHash,
      fullName: "Super Admin",
      role: "SUPERADMIN",
    });
  }
}
