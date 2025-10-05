import { z } from "zod";
import {
  ROLES,
  PASSWORD_MIN_LENGTH,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_COMPLEXITY_MESSAGE,
} from "../constants/index.js";

const passwordPolicy = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(10).optional(),
    jti: z.string().min(10).optional(),
    all: z.boolean().optional().default(false),
  })
  .refine((value) => value.all || value.refreshToken || value.jti, {
    message: "Provide refreshToken, jti, or set all to true",
    path: ["refreshToken"],
  });

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: passwordPolicy,
  fullName: z.string().min(3),
  role: z.enum(ROLES),
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: passwordPolicy,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
