import { z } from "zod";

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  termId: z.string().min(1),
});

export const bulkEnrollmentSchema = z.object({
  enrollments: z
    .array(
      z.object({
        studentId: z.string().min(1),
        classId: z.string().min(1),
        termId: z.string().min(1),
      })
    )
    .min(1)
    .max(200),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type BulkEnrollmentInput = z.infer<typeof bulkEnrollmentSchema>;
