import { z } from "zod";
export declare const createClassSchema: z.ZodObject<
  {
    name: z.ZodString;
    level: z.ZodNumber;
    homeroomId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name: string;
    level: number;
    homeroomId?: string | undefined;
  },
  {
    name: string;
    level: number;
    homeroomId?: string | undefined;
  }
>;
export declare const updateClassSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodNumber>;
    homeroomId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name?: string | undefined;
    level?: number | undefined;
    homeroomId?: string | undefined;
  },
  {
    name?: string | undefined;
    level?: number | undefined;
    homeroomId?: string | undefined;
  }
>;
export declare const classQuerySchema: z.ZodObject<
  {
    level: z.ZodOptional<z.ZodNumber>;
    homeroomId: z.ZodOptional<z.ZodString>;
    termId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
  },
  "strip",
  z.ZodTypeAny,
  {
    search?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    termId?: string | undefined;
    level?: number | undefined;
    homeroomId?: string | undefined;
  },
  {
    search?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    termId?: string | undefined;
    level?: number | undefined;
    homeroomId?: string | undefined;
  }
>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassQuery = z.infer<typeof classQuerySchema>;
