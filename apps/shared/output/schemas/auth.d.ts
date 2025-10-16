import { z } from "zod";
export declare const loginSchema: z.ZodObject<
  {
    email: z.ZodString;
    password: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    email: string;
    password: string;
  },
  {
    email: string;
    password: string;
  }
>;
export declare const refreshSchema: z.ZodObject<
  {
    refreshToken: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    refreshToken: string;
  },
  {
    refreshToken: string;
  }
>;
export declare const logoutSchema: z.ZodEffects<
  z.ZodObject<
    {
      refreshToken: z.ZodOptional<z.ZodString>;
      jti: z.ZodOptional<z.ZodString>;
      all: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    },
    "strip",
    z.ZodTypeAny,
    {
      all: boolean;
      refreshToken?: string | undefined;
      jti?: string | undefined;
    },
    {
      refreshToken?: string | undefined;
      jti?: string | undefined;
      all?: boolean | undefined;
    }
  >,
  {
    all: boolean;
    refreshToken?: string | undefined;
    jti?: string | undefined;
  },
  {
    refreshToken?: string | undefined;
    jti?: string | undefined;
    all?: boolean | undefined;
  }
>;
export declare const registerUserSchema: z.ZodObject<
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
export declare const updatePasswordSchema: z.ZodObject<
  {
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    currentPassword: string;
    newPassword: string;
  },
  {
    currentPassword: string;
    newPassword: string;
  }
>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
