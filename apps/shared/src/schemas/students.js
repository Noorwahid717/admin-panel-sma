"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkStudentImportSchema =
  exports.studentQuerySchema =
  exports.updateStudentSchema =
  exports.createStudentSchema =
  exports.genderEnum =
    void 0;
const zod_1 = require("zod");
exports.genderEnum = zod_1.z.enum(["M", "F"]);
exports.createStudentSchema = zod_1.z.object({
  nis: zod_1.z.string().min(3),
  fullName: zod_1.z.string().min(3),
  birthDate: zod_1.z.coerce.date(),
  gender: exports.genderEnum,
  guardian: zod_1.z.string().optional(),
});
exports.updateStudentSchema = exports.createStudentSchema.partial();
exports.studentQuerySchema = zod_1.z.object({
  classId: zod_1.z.string().optional(),
  termId: zod_1.z.string().optional(),
  search: zod_1.z.string().optional(),
  limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
  cursor: zod_1.z.string().optional(),
});
exports.bulkStudentImportSchema = zod_1.z.object({
  students: zod_1.z
    .array(
      zod_1.z.object({
        nis: zod_1.z.string().min(3),
        fullName: zod_1.z.string().min(3),
        birthDate: zod_1.z.string(),
        gender: exports.genderEnum,
        guardian: zod_1.z.string().optional(),
      })
    )
    .min(1)
    .max(200),
});
//# sourceMappingURL=students.js.map
