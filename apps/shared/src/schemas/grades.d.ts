import { z } from "zod";
export declare const createGradeComponentSchema: z.ZodObject<
  {
    name: z.ZodString;
    weight: z.ZodNumber;
    subjectId: z.ZodString;
    termId: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    name: string;
    termId: string;
    subjectId: string;
    weight: number;
  },
  {
    name: string;
    termId: string;
    subjectId: string;
    weight: number;
  }
>;
export declare const updateGradeComponentSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    weight: z.ZodOptional<z.ZodNumber>;
    subjectId: z.ZodOptional<z.ZodString>;
    termId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
    weight?: number | undefined;
  },
  {
    name?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
    weight?: number | undefined;
  }
>;
export declare const createGradeSchema: z.ZodObject<
  {
    enrollmentId: z.ZodString;
    subjectId: z.ZodString;
    componentId: z.ZodString;
    score: z.ZodNumber;
  },
  "strip",
  z.ZodTypeAny,
  {
    subjectId: string;
    enrollmentId: string;
    componentId: string;
    score: number;
  },
  {
    subjectId: string;
    enrollmentId: string;
    componentId: string;
    score: number;
  }
>;
export declare const gradeQuerySchema: z.ZodObject<
  {
    studentId: z.ZodOptional<z.ZodString>;
    subjectId: z.ZodOptional<z.ZodString>;
    termId: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    studentId?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
  },
  {
    studentId?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
  }
>;
export type CreateGradeComponentInput = z.infer<typeof createGradeComponentSchema>;
export type UpdateGradeComponentInput = z.infer<typeof updateGradeComponentSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type GradeQueryInput = z.infer<typeof gradeQuerySchema>;
//# sourceMappingURL=grades.d.ts.map
