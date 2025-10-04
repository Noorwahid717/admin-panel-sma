"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
const passwordPolicy = zod_1.z
  .string()
  .min(constants_1.PASSWORD_MIN_LENGTH)
  .regex(constants_1.PASSWORD_COMPLEXITY_REGEX, constants_1.PASSWORD_COMPLEXITY_MESSAGE);
exports.createUserSchema = zod_1.z.object({
  email: zod_1.z.string().email(),
  password: passwordPolicy,
  fullName: zod_1.z.string().min(3),
  role: zod_1.z.enum(constants_1.ROLES),
  teacherId: zod_1.z.string().optional(),
  studentId: zod_1.z.string().optional(),
});
exports.updateUserSchema = zod_1.z.object({
  fullName: zod_1.z.string().min(3).optional(),
  role: zod_1.z.enum(constants_1.ROLES).optional(),
  teacherId: zod_1.z.string().nullable().optional(),
  studentId: zod_1.z.string().nullable().optional(),
});
exports.userQuerySchema = zod_1.z.object({
  role: zod_1.z.enum(constants_1.ROLES).optional(),
  search: zod_1.z.string().optional(),
  limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
  cursor: zod_1.z.string().optional(),
});
//# sourceMappingURL=users.js.map
