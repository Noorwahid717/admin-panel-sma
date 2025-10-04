"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema =
  exports.registerUserSchema =
  exports.logoutSchema =
  exports.refreshSchema =
  exports.loginSchema =
    void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
const passwordPolicy = zod_1.z
  .string()
  .min(constants_1.PASSWORD_MIN_LENGTH)
  .regex(constants_1.PASSWORD_COMPLEXITY_REGEX, constants_1.PASSWORD_COMPLEXITY_MESSAGE);
exports.loginSchema = zod_1.z.object({
  email: zod_1.z.string().email(),
  password: zod_1.z.string().min(8),
});
exports.refreshSchema = zod_1.z.object({
  refreshToken: zod_1.z.string().min(10),
});
exports.logoutSchema = zod_1.z
  .object({
    refreshToken: zod_1.z.string().min(10).optional(),
    jti: zod_1.z.string().min(10).optional(),
    all: zod_1.z.boolean().optional().default(false),
  })
  .refine((value) => value.all || value.refreshToken || value.jti, {
    message: "Provide refreshToken, jti, or set all to true",
    path: ["refreshToken"],
  });
exports.registerUserSchema = zod_1.z.object({
  email: zod_1.z.string().email(),
  password: passwordPolicy,
  fullName: zod_1.z.string().min(3),
  role: zod_1.z.enum(constants_1.ROLES),
  teacherId: zod_1.z.string().optional(),
  studentId: zod_1.z.string().optional(),
});
exports.updatePasswordSchema = zod_1.z.object({
  currentPassword: zod_1.z.string().min(8),
  newPassword: passwordPolicy,
});
//# sourceMappingURL=auth.js.map
