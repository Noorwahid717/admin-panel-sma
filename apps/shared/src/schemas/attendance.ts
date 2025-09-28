import { z } from "zod";

export const attendanceStatusEnum = z.enum(["H", "I", "S", "A"]);

export const createAttendanceRecordSchema = z.object({
  enrollmentId: z.string().min(1),
  date: z.coerce.date(),
  sessionType: z.enum(["Harian", "Mapel"]),
  status: attendanceStatusEnum,
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  classId: z.string().min(1),
  termId: z.string().optional(),
  records: z
    .array(
      z.object({
        enrollmentId: z.string().min(1),
        date: z.string(),
        sessionType: z.enum(["Harian", "Mapel"]),
        status: attendanceStatusEnum,
        subjectId: z.string().optional(),
      })
    )
    .min(1)
    .max(200),
});

export const attendanceQuerySchema = z.object({
  classId: z.string().optional(),
  date: z.coerce.date().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  termId: z.string().optional(),
});

export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
