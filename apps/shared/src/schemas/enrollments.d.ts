import { z } from "zod";
export declare const createEnrollmentSchema: z.ZodObject<
  {
    studentId: z.ZodString;
    classId: z.ZodString;
    termId: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    studentId: string;
    classId: string;
    termId: string;
  },
  {
    studentId: string;
    classId: string;
    termId: string;
  }
>;
export declare const bulkEnrollmentSchema: z.ZodObject<
  {
    enrollments: z.ZodArray<
      z.ZodObject<
        {
          studentId: z.ZodString;
          classId: z.ZodString;
          termId: z.ZodString;
        },
        "strip",
        z.ZodTypeAny,
        {
          studentId: string;
          classId: string;
          termId: string;
        },
        {
          studentId: string;
          classId: string;
          termId: string;
        }
      >,
      "many"
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    enrollments: {
      studentId: string;
      classId: string;
      termId: string;
    }[];
  },
  {
    enrollments: {
      studentId: string;
      classId: string;
      termId: string;
    }[];
  }
>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type BulkEnrollmentInput = z.infer<typeof bulkEnrollmentSchema>;
//# sourceMappingURL=enrollments.d.ts.map
