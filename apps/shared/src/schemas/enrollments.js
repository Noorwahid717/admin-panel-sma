"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkEnrollmentSchema = exports.createEnrollmentSchema = void 0;
const zod_1 = require("zod");
exports.createEnrollmentSchema = zod_1.z.object({
  studentId: zod_1.z.string().min(1),
  classId: zod_1.z.string().min(1),
  termId: zod_1.z.string().min(1),
});
exports.bulkEnrollmentSchema = zod_1.z.object({
  enrollments: zod_1.z
    .array(
      zod_1.z.object({
        studentId: zod_1.z.string().min(1),
        classId: zod_1.z.string().min(1),
        termId: zod_1.z.string().min(1),
      })
    )
    .min(1)
    .max(200),
});
//# sourceMappingURL=enrollments.js.map
