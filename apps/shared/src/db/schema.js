"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectRelations =
  exports.classRelations =
  exports.teacherRelations =
  exports.studentRelations =
  exports.userRelations =
  exports.refreshTokens =
  exports.reportJobs =
  exports.activityLog =
  exports.attendance =
  exports.grades =
  exports.gradeComponents =
  exports.scheduleEntries =
  exports.teachingAssignments =
  exports.enrollments =
  exports.terms =
  exports.subjects =
  exports.classes =
  exports.teachers =
  exports.students =
  exports.users =
  exports.roles =
    void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.roles = ["SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM", "STUDENT", "PARENT"];
exports.users = (0, pg_core_1.pgTable)("users", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  email: (0, pg_core_1.text)("email").notNull().unique(),
  password: (0, pg_core_1.text)("password").notNull(),
  fullName: (0, pg_core_1.text)("full_name").notNull(),
  role: (0, pg_core_1.text)("role").notNull(),
  teacherId: (0, pg_core_1.text)("teacher_id"),
  studentId: (0, pg_core_1.text)("student_id"),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.students = (0, pg_core_1.pgTable)(
  "students",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    nis: (0, pg_core_1.text)("nis").notNull().unique(),
    fullName: (0, pg_core_1.text)("full_name").notNull(),
    birthDate: (0, pg_core_1.timestamp)("birth_date", { withTimezone: true }).notNull(),
    gender: (0, pg_core_1.text)("gender").notNull(),
    guardian: (0, pg_core_1.text)("guardian"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_nis: (0, pg_core_1.uniqueIndex)("idx_students_nis").on(t.nis),
  })
);
exports.teachers = (0, pg_core_1.pgTable)("teachers", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  nip: (0, pg_core_1.text)("nip"),
  fullName: (0, pg_core_1.text)("full_name").notNull(),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.classes = (0, pg_core_1.pgTable)("classes", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  name: (0, pg_core_1.text)("name").notNull(),
  level: (0, pg_core_1.integer)("level").notNull(),
  homeroomId: (0, pg_core_1.text)("homeroom_id"),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.subjects = (0, pg_core_1.pgTable)("subjects", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  code: (0, pg_core_1.text)("code").notNull().unique(),
  name: (0, pg_core_1.text)("name").notNull(),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.terms = (0, pg_core_1.pgTable)("terms", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  name: (0, pg_core_1.text)("name").notNull(),
  startDate: (0, pg_core_1.timestamp)("start_date", { withTimezone: true }).notNull(),
  endDate: (0, pg_core_1.timestamp)("end_date", { withTimezone: true }).notNull(),
  active: (0, pg_core_1.boolean)("active").default(false),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.enrollments = (0, pg_core_1.pgTable)(
  "enrollments",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    studentId: (0, pg_core_1.text)("student_id").notNull(),
    classId: (0, pg_core_1.text)("class_id").notNull(),
    termId: (0, pg_core_1.text)("term_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: (0, pg_core_1.uniqueIndex)("unq_enrollment").on(t.studentId, t.classId, t.termId),
  })
);
exports.teachingAssignments = (0, pg_core_1.pgTable)("teaching_assignments", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  teacherId: (0, pg_core_1.text)("teacher_id").notNull(),
  subjectId: (0, pg_core_1.text)("subject_id").notNull(),
  classId: (0, pg_core_1.text)("class_id"),
  termId: (0, pg_core_1.text)("term_id"),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
});
exports.scheduleEntries = (0, pg_core_1.pgTable)("schedule_entries", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  classId: (0, pg_core_1.text)("class_id").notNull(),
  subjectId: (0, pg_core_1.text)("subject_id").notNull(),
  teacherId: (0, pg_core_1.text)("teacher_id").notNull(),
  dayOfWeek: (0, pg_core_1.integer)("day_of_week").notNull(),
  startTime: (0, pg_core_1.text)("start_time").notNull(),
  endTime: (0, pg_core_1.text)("end_time").notNull(),
  termId: (0, pg_core_1.text)("term_id"),
});
exports.gradeComponents = (0, pg_core_1.pgTable)(
  "grade_components",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    weight: (0, pg_core_1.integer)("weight").notNull(),
    subjectId: (0, pg_core_1.text)("subject_id").notNull(),
    termId: (0, pg_core_1.text)("term_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: (0, pg_core_1.uniqueIndex)("unq_grade_component").on(t.name, t.subjectId, t.termId),
  })
);
exports.grades = (0, pg_core_1.pgTable)(
  "grades",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    enrollmentId: (0, pg_core_1.text)("enrollment_id").notNull(),
    subjectId: (0, pg_core_1.text)("subject_id").notNull(),
    componentId: (0, pg_core_1.text)("component_id").notNull(),
    score: (0, pg_core_1.real)("score").notNull(),
    teacherId: (0, pg_core_1.text)("teacher_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: (0, pg_core_1.uniqueIndex)("unq_grade").on(t.enrollmentId, t.subjectId, t.componentId),
  })
);
exports.attendance = (0, pg_core_1.pgTable)(
  "attendance",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    enrollmentId: (0, pg_core_1.text)("enrollment_id").notNull(),
    date: (0, pg_core_1.timestamp)("date", { withTimezone: true }).notNull(),
    sessionType: (0, pg_core_1.text)("session_type").notNull(),
    status: (0, pg_core_1.text)("status").notNull(),
    subjectId: (0, pg_core_1.text)("subject_id"),
    teacherId: (0, pg_core_1.text)("teacher_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: (0, pg_core_1.uniqueIndex)("unq_attendance").on(
      t.enrollmentId,
      t.date,
      t.sessionType,
      t.subjectId
    ),
  })
);
exports.activityLog = (0, pg_core_1.pgTable)("activity_log", {
  id: (0, pg_core_1.text)("id").primaryKey(),
  userId: (0, pg_core_1.text)("user_id").notNull(),
  action: (0, pg_core_1.text)("action").notNull(),
  entity: (0, pg_core_1.text)("entity").notNull(),
  entityId: (0, pg_core_1.text)("entity_id"),
  ipAddress: (0, pg_core_1.text)("ip_address"),
  metadata: (0, pg_core_1.text)("metadata"),
  createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
});
exports.reportJobs = (0, pg_core_1.pgTable)(
  "report_jobs",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    enrollmentId: (0, pg_core_1.text)("enrollment_id").notNull(),
    status: (0, pg_core_1.text)("status").notNull(),
    pdfUrl: (0, pg_core_1.text)("pdf_url"),
    requestedBy: (0, pg_core_1.text)("requested_by").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: (0, pg_core_1.uniqueIndex)("unq_report_jobs_enrollment").on(t.enrollmentId),
  })
);
exports.refreshTokens = (0, pg_core_1.pgTable)(
  "refresh_tokens",
  {
    id: (0, pg_core_1.text)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull(),
    jti: (0, pg_core_1.text)("jti").notNull(),
    revokedAt: (0, pg_core_1.timestamp)("revoked_at", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    userAgent: (0, pg_core_1.text)("user_agent"),
    ipAddress: (0, pg_core_1.text)("ip_address"),
  },
  (table) => ({
    jtiIdx: (0, pg_core_1.uniqueIndex)("unq_refresh_tokens_jti").on(table.jti),
    userIdx: (0, pg_core_1.index)("idx_refresh_tokens_user").on(table.userId),
  })
);
exports.userRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
  teacher: one(exports.teachers, {
    fields: [exports.users.teacherId],
    references: [exports.teachers.id],
  }),
  student: one(exports.students, {
    fields: [exports.users.studentId],
    references: [exports.students.id],
  }),
  reportJobs: many(exports.reportJobs),
}));
exports.studentRelations = (0, drizzle_orm_1.relations)(exports.students, ({ many }) => ({
  enrollments: many(exports.enrollments),
}));
exports.teacherRelations = (0, drizzle_orm_1.relations)(exports.teachers, ({ many }) => ({
  assignments: many(exports.teachingAssignments),
}));
exports.classRelations = (0, drizzle_orm_1.relations)(exports.classes, ({ many, one }) => ({
  enrollments: many(exports.enrollments),
  scheduleEntries: many(exports.scheduleEntries),
  homeroom: one(exports.teachers, {
    fields: [exports.classes.homeroomId],
    references: [exports.teachers.id],
  }),
}));
exports.subjectRelations = (0, drizzle_orm_1.relations)(exports.subjects, ({ many }) => ({
  gradeComponents: many(exports.gradeComponents),
}));
//# sourceMappingURL=schema.js.map
