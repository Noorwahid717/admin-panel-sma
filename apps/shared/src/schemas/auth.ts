import { z } from "zod";
import { ROLES } from "../constants";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  role: z.enum(ROLES),
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
