import { z } from "zod";
export const genderEnum = z.enum(["M", "F"]);
export const createStudentSchema = z.object({
  nis: z.string().min(3),
  fullName: z.string().min(3),
  birthDate: z.coerce.date(),
  gender: genderEnum,
  guardian: z.string().optional(),
});
export const updateStudentSchema = createStudentSchema.partial();
export const studentQuerySchema = z.object({
  classId: z.string().optional(),
  termId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});
export const bulkStudentImportSchema = z.object({
  students: z
    .array(
      z.object({
        nis: z.string().min(3),
        fullName: z.string().min(3),
        birthDate: z.string(),
        gender: genderEnum,
        guardian: z.string().optional(),
      })
    )
    .min(1)
    .max(200),
});
