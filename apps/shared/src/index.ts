export * from "./schemas/index.js";
export * from "./constants/index.js";
export * from "./types/index.js";
// Export db exports with specific names to avoid conflicts
export {
  users,
  students,
  teachers,
  classes,
  subjects,
  terms,
  enrollments,
  teachingAssignments,
  scheduleEntries,
  gradeComponents,
  grades,
  attendance,
  activityLog,
  reportJobs,
  refreshTokens,
  roles as dbRoles,
  type Role as DbRole,
  userRelations,
  studentRelations,
  teacherRelations,
  classRelations,
  subjectRelations,
} from "./db/schema";
export { createDatabasePool, createDbClient, type Database } from "./db/client";
