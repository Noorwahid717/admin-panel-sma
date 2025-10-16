import { z } from "zod";
export declare const createSubjectSchema: z.ZodObject<
  {
    code: z.ZodString;
    name: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    code: string;
    name: string;
  },
  {
    code: string;
    name: string;
  }
>;
export declare const updateSubjectSchema: z.ZodObject<
  {
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    code?: string | undefined;
    name?: string | undefined;
  },
  {
    code?: string | undefined;
    name?: string | undefined;
  }
>;
export declare const subjectQuerySchema: z.ZodObject<
  {
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    search?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  },
  {
    search?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  }
>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type SubjectQuery = z.infer<typeof subjectQuerySchema>;
