import { z } from "zod";
export declare const createUserSchema: z.ZodObject<
  {
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodEnum<
      ["SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM", "STUDENT", "PARENT"]
    >;
    teacherId: z.ZodOptional<z.ZodString>;
    studentId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    email: string;
    password: string;
    fullName: string;
    role: "SUPERADMIN" | "ADMIN" | "OPERATOR" | "TEACHER" | "HOMEROOM" | "STUDENT" | "PARENT";
    teacherId?: string | undefined;
    studentId?: string | undefined;
  },
  {
    email: string;
    password: string;
    fullName: string;
    role: "SUPERADMIN" | "ADMIN" | "OPERATOR" | "TEACHER" | "HOMEROOM" | "STUDENT" | "PARENT";
    teacherId?: string | undefined;
    studentId?: string | undefined;
  }
>;
export declare const updateUserSchema: z.ZodObject<
  {
    fullName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<
      z.ZodEnum<["SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM", "STUDENT", "PARENT"]>
    >;
    teacherId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    studentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    fullName?: string | undefined;
    role?:
      | "SUPERADMIN"
      | "ADMIN"
      | "OPERATOR"
      | "TEACHER"
      | "HOMEROOM"
      | "STUDENT"
      | "PARENT"
      | undefined;
    teacherId?: string | null | undefined;
    studentId?: string | null | undefined;
  },
  {
    fullName?: string | undefined;
    role?:
      | "SUPERADMIN"
      | "ADMIN"
      | "OPERATOR"
      | "TEACHER"
      | "HOMEROOM"
      | "STUDENT"
      | "PARENT"
      | undefined;
    teacherId?: string | null | undefined;
    studentId?: string | null | undefined;
  }
>;
export declare const userQuerySchema: z.ZodObject<
  {
    role: z.ZodOptional<
      z.ZodEnum<["SUPERADMIN", "ADMIN", "OPERATOR", "TEACHER", "HOMEROOM", "STUDENT", "PARENT"]>
    >;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    role?:
      | "SUPERADMIN"
      | "ADMIN"
      | "OPERATOR"
      | "TEACHER"
      | "HOMEROOM"
      | "STUDENT"
      | "PARENT"
      | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  },
  {
    role?:
      | "SUPERADMIN"
      | "ADMIN"
      | "OPERATOR"
      | "TEACHER"
      | "HOMEROOM"
      | "STUDENT"
      | "PARENT"
      | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  }
>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
