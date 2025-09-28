import { z } from "zod";

export const createTermSchema = z.object({
  name: z.string().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  active: z.boolean().optional(),
});

export const updateTermSchema = createTermSchema.partial();

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
