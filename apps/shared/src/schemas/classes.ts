import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(2),
  level: z.number().int().min(10).max(12),
  homeroomId: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const classQuerySchema = z.object({
  level: z.coerce.number().int().min(10).max(12).optional(),
  homeroomId: z.string().optional(),
  termId: z.string().optional(),
  search: z.string().min(1).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassQuery = z.infer<typeof classQuerySchema>;
