import { z } from "zod";
export declare const genderEnum: z.ZodEnum<["M", "F"]>;
export declare const createStudentSchema: z.ZodObject<
  {
    nis: z.ZodString;
    fullName: z.ZodString;
    birthDate: z.ZodDate;
    gender: z.ZodEnum<["M", "F"]>;
    guardian: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    fullName: string;
    nis: string;
    birthDate: Date;
    gender: "M" | "F";
    guardian?: string | undefined;
  },
  {
    fullName: string;
    nis: string;
    birthDate: Date;
    gender: "M" | "F";
    guardian?: string | undefined;
  }
>;
export declare const updateStudentSchema: z.ZodObject<
  {
    nis: z.ZodOptional<z.ZodString>;
    fullName: z.ZodOptional<z.ZodString>;
    birthDate: z.ZodOptional<z.ZodDate>;
    gender: z.ZodOptional<z.ZodEnum<["M", "F"]>>;
    guardian: z.ZodOptional<z.ZodOptional<z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    fullName?: string | undefined;
    nis?: string | undefined;
    birthDate?: Date | undefined;
    gender?: "M" | "F" | undefined;
    guardian?: string | undefined;
  },
  {
    fullName?: string | undefined;
    nis?: string | undefined;
    birthDate?: Date | undefined;
    gender?: "M" | "F" | undefined;
    guardian?: string | undefined;
  }
>;
export declare const studentQuerySchema: z.ZodObject<
  {
    classId: z.ZodOptional<z.ZodString>;
    termId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    search?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  },
  {
    search?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  }
>;
export declare const bulkStudentImportSchema: z.ZodObject<
  {
    students: z.ZodArray<
      z.ZodObject<
        {
          nis: z.ZodString;
          fullName: z.ZodString;
          birthDate: z.ZodString;
          gender: z.ZodEnum<["M", "F"]>;
          guardian: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          fullName: string;
          nis: string;
          birthDate: string;
          gender: "M" | "F";
          guardian?: string | undefined;
        },
        {
          fullName: string;
          nis: string;
          birthDate: string;
          gender: "M" | "F";
          guardian?: string | undefined;
        }
      >,
      "many"
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    students: {
      fullName: string;
      nis: string;
      birthDate: string;
      gender: "M" | "F";
      guardian?: string | undefined;
    }[];
  },
  {
    students: {
      fullName: string;
      nis: string;
      birthDate: string;
      gender: "M" | "F";
      guardian?: string | undefined;
    }[];
  }
>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;
export type BulkStudentImportInput = z.infer<typeof bulkStudentImportSchema>;
//# sourceMappingURL=students.d.ts.map
