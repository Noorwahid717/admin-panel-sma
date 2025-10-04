import { z } from "zod";
export declare const createTeacherSchema: z.ZodObject<
  {
    nip: z.ZodOptional<z.ZodString>;
    fullName: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    fullName: string;
    nip?: string | undefined;
  },
  {
    fullName: string;
    nip?: string | undefined;
  }
>;
export declare const updateTeacherSchema: z.ZodObject<
  {
    nip: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fullName: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    fullName?: string | undefined;
    nip?: string | undefined;
  },
  {
    fullName?: string | undefined;
    nip?: string | undefined;
  }
>;
export declare const teacherQuerySchema: z.ZodObject<
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
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type TeacherQuery = z.infer<typeof teacherQuerySchema>;
//# sourceMappingURL=teachers.d.ts.map
