import { z } from "zod";
export const createTeacherSchema = z.object({
  nip: z.string().optional(),
  fullName: z.string().min(3),
});
export const updateTeacherSchema = createTeacherSchema.partial();
export const teacherQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});
