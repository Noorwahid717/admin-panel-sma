/* eslint-disable no-console */
import "dotenv/config";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { createDatabasePool, createDbClient, type Database } from "./client";
import {
  attendance,
  classes,
  enrollments,
  gradeComponents,
  grades,
  students,
  subjects,
  teachers,
  terms,
  users,
} from "./schema";

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

const TEACHER_SEEDS = [
  {
    id: "teacher_rahma",
    nip: "198003152022011001",
    fullName: "Rahma Putri",
  },
  {
    id: "teacher_bima",
    nip: "197912102022021002",
    fullName: "Bima Saputra",
  },
  {
    id: "teacher_laras",
    nip: "198510052022031003",
    fullName: "Laras Dewi",
  },
] as const;

const STUDENT_SEEDS = [
  {
    id: "student_alif",
    nis: "2024001",
    fullName: "Alif Pratama",
    birthDate: "2008-05-12",
    gender: "M",
    guardian: "Ahmad Pratama",
  },
  {
    id: "student_siti",
    nis: "2024002",
    fullName: "Siti Rahmawati",
    birthDate: "2008-09-03",
    gender: "F",
    guardian: "Nur Rahma",
  },
  {
    id: "student_darwin",
    nis: "2024003",
    fullName: "Darwin Saputra",
    birthDate: "2008-01-28",
    gender: "M",
    guardian: "Rizal Saputra",
  },
  {
    id: "student_nadia",
    nis: "2024004",
    fullName: "Nadia Kartika",
    birthDate: "2008-11-15",
    gender: "F",
    guardian: "Kartika Ayu",
  },
  {
    id: "student_farhan",
    nis: "2024005",
    fullName: "Farhan Yusuf",
    birthDate: "2008-07-08",
    gender: "M",
    guardian: "Yusuf Haryanto",
  },
] as const;

const CLASS_SEEDS = [
  {
    id: "class_xi_ipa_1",
    name: "XI IPA 1",
    level: 11,
    homeroomId: "teacher_rahma",
  },
  {
    id: "class_xi_ipa_2",
    name: "XI IPA 2",
    level: 11,
    homeroomId: "teacher_laras",
  },
] as const;

const ENROLLMENT_SEEDS = [
  {
    id: "enrollment_alif",
    studentId: "student_alif",
    classId: "class_xi_ipa_1",
  },
  {
    id: "enrollment_siti",
    studentId: "student_siti",
    classId: "class_xi_ipa_1",
  },
  {
    id: "enrollment_darwin",
    studentId: "student_darwin",
    classId: "class_xi_ipa_2",
  },
  {
    id: "enrollment_nadia",
    studentId: "student_nadia",
    classId: "class_xi_ipa_2",
  },
  {
    id: "enrollment_farhan",
    studentId: "student_farhan",
    classId: "class_xi_ipa_1",
  },
] as const;

const GRADE_COMPONENT_SEEDS = [
  {
    id: "grade_component_mat_assignment",
    subjectCode: "MAT",
    name: "Tugas Harian",
    weight: 40,
  },
  {
    id: "grade_component_mat_exam",
    subjectCode: "MAT",
    name: "Ujian Semester",
    weight: 60,
  },
  {
    id: "grade_component_fis_practicum",
    subjectCode: "FIS",
    name: "Praktikum",
    weight: 40,
  },
  {
    id: "grade_component_fis_exam",
    subjectCode: "FIS",
    name: "Ujian Teori",
    weight: 60,
  },
] as const;

const GRADE_SEEDS = [
  {
    id: "grade_alif_mat_assignment",
    enrollmentId: "enrollment_alif",
    subjectCode: "MAT",
    componentId: "grade_component_mat_assignment",
    score: 86,
    teacherId: "teacher_rahma",
  },
  {
    id: "grade_alif_mat_exam",
    enrollmentId: "enrollment_alif",
    subjectCode: "MAT",
    componentId: "grade_component_mat_exam",
    score: 92,
    teacherId: "teacher_rahma",
  },
  {
    id: "grade_siti_fis_practicum",
    enrollmentId: "enrollment_siti",
    subjectCode: "FIS",
    componentId: "grade_component_fis_practicum",
    score: 88,
    teacherId: "teacher_bima",
  },
  {
    id: "grade_siti_fis_exam",
    enrollmentId: "enrollment_siti",
    subjectCode: "FIS",
    componentId: "grade_component_fis_exam",
    score: 91,
    teacherId: "teacher_bima",
  },
] as const;

const ATTENDANCE_SEEDS = [
  {
    id: "attendance_alif_20250716",
    enrollmentId: "enrollment_alif",
    subjectCode: "MAT",
    date: "2025-07-16",
    sessionType: "Mapel",
    status: "H",
    teacherId: "teacher_rahma",
  },
  {
    id: "attendance_siti_20250716",
    enrollmentId: "enrollment_siti",
    subjectCode: "MAT",
    date: "2025-07-16",
    sessionType: "Mapel",
    status: "H",
    teacherId: "teacher_rahma",
  },
  {
    id: "attendance_darwin_20250717",
    enrollmentId: "enrollment_darwin",
    subjectCode: "FIS",
    date: "2025-07-17",
    sessionType: "Mapel",
    status: "I",
    teacherId: "teacher_bima",
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

function parseDateOnly(source: string) {
  const date = new Date(`${source}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${source}`);
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

  const subjectCodes = SUBJECT_SEEDS.map((subject) => subject.code);
  const subjectRows = await db
    .select({
      id: subjects.id,
      code: subjects.code,
    })
    .from(subjects)
    .where(inArray(subjects.code, subjectCodes));

  const subjectMap = new Map(subjectRows.map((subject) => [subject.code, subject.id]));

  console.log(`✔ Subjects ensured (${subjectMap.size})`);

  return subjectMap;
}

async function ensureTeachers(db: Database) {
  const now = new Date();

  for (const teacher of TEACHER_SEEDS) {
    await db
      .insert(teachers)
      .values({
        id: teacher.id,
        nip: teacher.nip,
        fullName: teacher.fullName,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: teachers.id,
        set: {
          nip: teacher.nip,
          fullName: teacher.fullName,
          updatedAt: now,
        },
      });
  }

  console.log(`✔ Teachers ensured (${TEACHER_SEEDS.length})`);
}

async function ensureStudents(db: Database) {
  const now = new Date();

  for (const student of STUDENT_SEEDS) {
    const birthDate = parseDateOnly(student.birthDate);

    await db
      .insert(students)
      .values({
        id: student.id,
        nis: student.nis,
        fullName: student.fullName,
        birthDate,
        gender: student.gender,
        guardian: student.guardian,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: students.nis,
        set: {
          fullName: student.fullName,
          birthDate,
          gender: student.gender,
          guardian: student.guardian,
          updatedAt: now,
        },
      });
  }

  console.log(`✔ Students ensured (${STUDENT_SEEDS.length})`);
}

async function ensureClasses(db: Database) {
  const now = new Date();

  for (const classItem of CLASS_SEEDS) {
    await db
      .insert(classes)
      .values({
        id: classItem.id,
        name: classItem.name,
        level: classItem.level,
        homeroomId: classItem.homeroomId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: classes.id,
        set: {
          name: classItem.name,
          level: classItem.level,
          homeroomId: classItem.homeroomId,
          updatedAt: now,
        },
      });
  }

  console.log(`✔ Classes ensured (${CLASS_SEEDS.length})`);
}

async function ensureEnrollments(db: Database, termId: string) {
  const now = new Date();

  for (const enrollment of ENROLLMENT_SEEDS) {
    await db
      .insert(enrollments)
      .values({
        id: enrollment.id,
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        termId,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: enrollments.id,
        set: {
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          termId,
        },
      });
  }

  console.log(`✔ Enrollments ensured (${ENROLLMENT_SEEDS.length})`);
}

async function ensureGradeComponents(
  db: Database,
  termId: string,
  subjectMap: Map<string, string>
) {
  const now = new Date();

  for (const component of GRADE_COMPONENT_SEEDS) {
    const subjectId = subjectMap.get(component.subjectCode);
    if (!subjectId) {
      console.warn(
        `⚠️ Subject not found for code ${component.subjectCode}, skipping component ${component.name}`
      );
      continue;
    }

    await db
      .insert(gradeComponents)
      .values({
        id: component.id,
        name: component.name,
        weight: component.weight,
        subjectId,
        termId,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: gradeComponents.id,
        set: {
          name: component.name,
          weight: component.weight,
          subjectId,
          termId,
        },
      });
  }

  console.log(`✔ Grade components ensured (${GRADE_COMPONENT_SEEDS.length})`);
}

async function ensureGrades(db: Database, subjectMap: Map<string, string>) {
  const now = new Date();

  for (const grade of GRADE_SEEDS) {
    const subjectId = subjectMap.get(grade.subjectCode);
    if (!subjectId) {
      console.warn(
        `⚠️ Subject not found for code ${grade.subjectCode}, skipping grade ${grade.id}`
      );
      continue;
    }

    await db
      .insert(grades)
      .values({
        id: grade.id,
        enrollmentId: grade.enrollmentId,
        subjectId,
        componentId: grade.componentId,
        score: grade.score,
        teacherId: grade.teacherId,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: grades.id,
        set: {
          subjectId,
          componentId: grade.componentId,
          score: grade.score,
          teacherId: grade.teacherId,
        },
      });
  }

  console.log(`✔ Grades ensured (${GRADE_SEEDS.length})`);
}

async function ensureAttendance(db: Database, subjectMap: Map<string, string>) {
  for (const record of ATTENDANCE_SEEDS) {
    const subjectId = subjectMap.get(record.subjectCode);
    if (!subjectId) {
      console.warn(
        `⚠️ Subject not found for code ${record.subjectCode}, skipping attendance ${record.id}`
      );
      continue;
    }

    const date = parseDateOnly(record.date);

    await db
      .insert(attendance)
      .values({
        id: record.id,
        enrollmentId: record.enrollmentId,
        date,
        sessionType: record.sessionType,
        status: record.status,
        subjectId,
        teacherId: record.teacherId,
      })
      .onConflictDoUpdate({
        target: attendance.id,
        set: {
          date,
          sessionType: record.sessionType,
          status: record.status,
          subjectId,
          teacherId: record.teacherId,
        },
      });
  }

  console.log(`✔ Attendance ensured (${ATTENDANCE_SEEDS.length})`);
}

async function getActiveTermId(db: Database) {
  const [activeTerm] = await db
    .select({ id: terms.id })
    .from(terms)
    .where(eq(terms.active, true))
    .limit(1);

  if (!activeTerm) {
    throw new Error("Active term not found after ensuring terms");
  }

  return activeTerm.id;
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
    const subjectMap = await ensureSubjects(db);
    await ensureTeachers(db);
    await ensureStudents(db);
    await ensureClasses(db);
    const activeTermId = await getActiveTermId(db);
    await ensureEnrollments(db, activeTermId);
    await ensureGradeComponents(db, activeTermId, subjectMap);
    await ensureGrades(db, subjectMap);
    await ensureAttendance(db, subjectMap);
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
