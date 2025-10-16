import { z } from "zod";
export const createScheduleEntrySchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.number().int().min(1).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  termId: z.string().optional(),
});
export const updateScheduleEntrySchema = createScheduleEntrySchema.partial();
export const scheduleQuerySchema = z.object({
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  subjectId: z.string().optional(),
  termId: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(1).max(6).optional(),
});
