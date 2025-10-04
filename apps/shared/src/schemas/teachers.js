"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherQuerySchema = exports.updateTeacherSchema = exports.createTeacherSchema = void 0;
const zod_1 = require("zod");
exports.createTeacherSchema = zod_1.z.object({
  nip: zod_1.z.string().optional(),
  fullName: zod_1.z.string().min(3),
});
exports.updateTeacherSchema = exports.createTeacherSchema.partial();
exports.teacherQuerySchema = zod_1.z.object({
  search: zod_1.z.string().optional(),
  limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
  cursor: zod_1.z.string().optional(),
});
//# sourceMappingURL=teachers.js.map
