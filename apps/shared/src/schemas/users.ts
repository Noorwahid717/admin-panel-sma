import { z } from "zod";
import { ROLES } from "../constants";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  role: z.enum(ROLES),
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(3).optional(),
  role: z.enum(ROLES).optional(),
  teacherId: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
});

export const userQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
