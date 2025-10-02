/* eslint-disable no-console */
import "dotenv/config";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { createDatabasePool, createDbClient, type Database } from "./client";
import { subjects, terms, users } from "./schema";

const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@example.sch.id";
const SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD ?? "Admin123!";
const SUPERADMIN_NAME = process.env.SEED_SUPERADMIN_NAME ?? "Super Admin";
const SUPERADMIN_ID = process.env.SEED_SUPERADMIN_ID ?? "user_superadmin";

const DEFAULT_TERM_ID = process.env.SEED_TERM_ID ?? "term_default";
const DEFAULT_TERM_NAME = process.env.SEED_TERM_NAME ?? "2025/2026 Semester 1";
const DEFAULT_TERM_START = process.env.SEED_TERM_START ?? "2025-07-15";
const DEFAULT_TERM_END = process.env.SEED_TERM_END ?? "2025-12-20";

const SUBJECT_SEEDS = [
  {
    id: process.env.SEED_SUBJECT_MAT_ID ?? "subject_mat",
    code: process.env.SEED_SUBJECT_MAT_CODE ?? "MAT",
    name: process.env.SEED_SUBJECT_MAT_NAME ?? "Matematika",
  },
  {
    id: process.env.SEED_SUBJECT_FIS_ID ?? "subject_fis",
    code: process.env.SEED_SUBJECT_FIS_CODE ?? "FIS",
    name: process.env.SEED_SUBJECT_FIS_NAME ?? "Fisika",
  },
] as const;

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const ARGON2_MEMORY_COST = parseNumber(process.env.ARGON2_MEMORY_COST, 19456);
const ARGON2_TIME_COST = parseNumber(process.env.ARGON2_TIME_COST, 2);

async function ensureSuperadmin(db: Database) {
  const normalizedEmail = SUPERADMIN_EMAIL.toLowerCase();
  const passwordHash = await argon2.hash(SUPERADMIN_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: ARGON2_MEMORY_COST,
    timeCost: ARGON2_TIME_COST,
  });
  const now = new Date();

  await db
    .insert(users)
    .values({
      id: SUPERADMIN_ID || randomUUID(),
      email: normalizedEmail,
      password: passwordHash,
      fullName: SUPERADMIN_NAME,
      role: "SUPERADMIN",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        password: passwordHash,
        fullName: SUPERADMIN_NAME,
        role: "SUPERADMIN",
        updatedAt: now,
      },
    });

  console.log(`✔ Superadmin ensured (${normalizedEmail})`);
}

function parseDateOrThrow(source: string, fallback: string) {
  const value = source?.trim()?.length ? source : fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return date;
}

async function ensureActiveTerm(db: Database) {
  const now = new Date();
  const startDate = parseDateOrThrow(DEFAULT_TERM_START, "2025-07-15");
  const endDate = parseDateOrThrow(DEFAULT_TERM_END, "2025-12-20");

  if (endDate <= startDate) {
    throw new Error("Seed term end date must be after start date");
  }

  await db.update(terms).set({ active: false, updatedAt: now });

  await db
    .insert(terms)
    .values({
      id: DEFAULT_TERM_ID || randomUUID(),
      name: DEFAULT_TERM_NAME,
      startDate,
      endDate,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: terms.id,
      set: {
        name: DEFAULT_TERM_NAME,
        startDate,
        endDate,
        active: true,
        updatedAt: now,
      },
    });

  console.log(`✔ Active term ensured (${DEFAULT_TERM_NAME})`);
}

async function ensureSubjects(db: Database) {
  const now = new Date();

  for (const subject of SUBJECT_SEEDS) {
    await db
      .insert(subjects)
      .values({
        id: subject.id || randomUUID(),
        code: subject.code,
        name: subject.name,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: subjects.code,
        set: {
          name: subject.name,
          updatedAt: now,
        },
      });
  }

  console.log("✔ Subjects ensured (MAT, FIS)");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run seed script");
  }

  const pool = createDatabasePool(databaseUrl);
  const db = createDbClient(pool);

  try {
    await ensureSuperadmin(db);
    await ensureActiveTerm(db);
    await ensureSubjects(db);
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log("✅ Seed completed");
  })
  .catch((error) => {
    console.error("❌ Seed failed", error);
    process.exitCode = 1;
  });
