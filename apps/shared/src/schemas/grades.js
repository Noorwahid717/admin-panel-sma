"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeQuerySchema =
  exports.createGradeSchema =
  exports.updateGradeComponentSchema =
  exports.createGradeComponentSchema =
    void 0;
const zod_1 = require("zod");
exports.createGradeComponentSchema = zod_1.z.object({
  name: zod_1.z.string().min(2),
  weight: zod_1.z.number().int().min(0).max(100),
  subjectId: zod_1.z.string().min(1),
  termId: zod_1.z.string().min(1),
});
exports.updateGradeComponentSchema = exports.createGradeComponentSchema.partial();
exports.createGradeSchema = zod_1.z.object({
  enrollmentId: zod_1.z.string().min(1),
  subjectId: zod_1.z.string().min(1),
  componentId: zod_1.z.string().min(1),
  score: zod_1.z.number().min(0).max(100),
});
exports.gradeQuerySchema = zod_1.z.object({
  studentId: zod_1.z.string().optional(),
  subjectId: zod_1.z.string().optional(),
  termId: zod_1.z.string().optional(),
  classId: zod_1.z.string().optional(),
});
//# sourceMappingURL=grades.js.map
