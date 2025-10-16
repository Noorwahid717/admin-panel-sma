import { z } from "zod";
export declare const reportRequestSchema: z.ZodObject<
  {
    enrollmentId: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    enrollmentId: string;
  },
  {
    enrollmentId: string;
  }
>;
export declare const reportPdfJobSchema: z.ZodObject<
  {
    reportJobId: z.ZodString;
    enrollmentId: z.ZodString;
    requestedBy: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    enrollmentId: string;
    reportJobId: string;
    requestedBy: string;
  },
  {
    enrollmentId: string;
    reportJobId: string;
    requestedBy: string;
  }
>;
export type ReportRequestInput = z.infer<typeof reportRequestSchema>;
export type ReportPdfJobData = z.infer<typeof reportPdfJobSchema>;
