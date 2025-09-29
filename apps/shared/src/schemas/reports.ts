import { z } from "zod";

export const reportRequestSchema = z.object({
  enrollmentId: z.string().min(1),
});

export const reportPdfJobSchema = z.object({
  reportJobId: z.string().min(1),
  enrollmentId: z.string().min(1),
  requestedBy: z.string().min(1),
});

export type ReportRequestInput = z.infer<typeof reportRequestSchema>;
export type ReportPdfJobData = z.infer<typeof reportPdfJobSchema>;
