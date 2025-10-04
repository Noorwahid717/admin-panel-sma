export * from "./schemas";
export * from "./constants";
export * from "./types";
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
