import { z } from "zod";
export const createSubjectSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
});
export const updateSubjectSchema = createSubjectSchema.partial();
export const subjectQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});
