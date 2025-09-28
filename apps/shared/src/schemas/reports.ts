import { z } from "zod";

export const reportRequestSchema = z.object({
  enrollmentId: z.string().min(1),
});

export type ReportRequestInput = z.infer<typeof reportRequestSchema>;
