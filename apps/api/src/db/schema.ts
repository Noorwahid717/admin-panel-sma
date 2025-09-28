import { pgTable, text, timestamp, integer, boolean, real, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roles = [
  "SUPERADMIN",
  "ADMIN",
  "OPERATOR",
  "TEACHER",
  "HOMEROOM",
  "STUDENT",
  "PARENT",
] as const;

export type Role = (typeof roles)[number];

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  teacherId: text("teacher_id"),
  studentId: text("student_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const students = pgTable(
  "students",
  {
    id: text("id").primaryKey(),
    nis: text("nis").notNull().unique(),
    fullName: text("full_name").notNull(),
    birthDate: timestamp("birth_date", { withTimezone: true }).notNull(),
    gender: text("gender").notNull(),
    guardian: text("guardian"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_nis: uniqueIndex("idx_students_nis").on(t.nis),
  })
);

export const teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  nip: text("nip"),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const classes = pgTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  homeroomId: text("homeroom_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const terms = pgTable("terms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull(),
    classId: text("class_id").notNull(),
    termId: text("term_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("unq_enrollment").on(t.studentId, t.classId, t.termId),
  })
);

export const teachingAssignments = pgTable("teaching_assignments", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  subjectId: text("subject_id").notNull(),
  classId: text("class_id"),
  termId: text("term_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const scheduleEntries = pgTable("schedule_entries", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull(),
  subjectId: text("subject_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  termId: text("term_id"),
});

export const gradeComponents = pgTable(
  "grade_components",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    weight: integer("weight").notNull(),
    subjectId: text("subject_id").notNull(),
    termId: text("term_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("unq_grade_component").on(t.name, t.subjectId, t.termId),
  })
);

export const grades = pgTable(
  "grades",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id").notNull(),
    subjectId: text("subject_id").notNull(),
    componentId: text("component_id").notNull(),
    score: real("score").notNull(),
    teacherId: text("teacher_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("unq_grade").on(t.enrollmentId, t.subjectId, t.componentId),
  })
);

export const attendance = pgTable(
  "attendance",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    sessionType: text("session_type").notNull(),
    status: text("status").notNull(),
    subjectId: text("subject_id"),
    teacherId: text("teacher_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("unq_attendance").on(t.enrollmentId, t.date, t.sessionType, t.subjectId),
  })
);

export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  ipAddress: text("ip_address"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reportJobs = pgTable(
  "report_jobs",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id").notNull(),
    status: text("status").notNull(),
    pdfUrl: text("pdf_url"),
    requestedBy: text("requested_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("unq_report_jobs_enrollment").on(t.enrollmentId),
  })
);

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [users.teacherId],
    references: [teachers.id],
  }),
  student: one(students, {
    fields: [users.studentId],
    references: [students.id],
  }),
  reportJobs: many(reportJobs),
}));

export const studentRelations = relations(students, ({ many }) => ({
  enrollments: many(enrollments),
}));

export const teacherRelations = relations(teachers, ({ many }) => ({
  assignments: many(teachingAssignments),
}));

export const classRelations = relations(classes, ({ many, one }) => ({
  enrollments: many(enrollments),
  scheduleEntries: many(scheduleEntries),
  homeroom: one(teachers, {
    fields: [classes.homeroomId],
    references: [teachers.id],
  }),
}));

export const subjectRelations = relations(subjects, ({ many }) => ({
  gradeComponents: many(gradeComponents),
}));
