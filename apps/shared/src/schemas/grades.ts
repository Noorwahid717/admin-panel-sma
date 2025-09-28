import { z } from "zod";

export const createGradeComponentSchema = z.object({
  name: z.string().min(2),
  weight: z.number().int().min(0).max(100),
  subjectId: z.string().min(1),
  termId: z.string().min(1),
});

export const updateGradeComponentSchema = createGradeComponentSchema.partial();

export const createGradeSchema = z.object({
  enrollmentId: z.string().min(1),
  subjectId: z.string().min(1),
  componentId: z.string().min(1),
  score: z.number().min(0).max(100),
});

export const gradeQuerySchema = z.object({
  studentId: z.string().optional(),
  subjectId: z.string().optional(),
  termId: z.string().optional(),
  classId: z.string().optional(),
});

export type CreateGradeComponentInput = z.infer<typeof createGradeComponentSchema>;
export type UpdateGradeComponentInput = z.infer<typeof updateGradeComponentSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type GradeQueryInput = z.infer<typeof gradeQuerySchema>;
