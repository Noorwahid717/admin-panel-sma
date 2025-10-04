"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceQuerySchema =
  exports.bulkAttendanceSchema =
  exports.createAttendanceRecordSchema =
  exports.attendanceStatusEnum =
    void 0;
const zod_1 = require("zod");
exports.attendanceStatusEnum = zod_1.z.enum(["H", "I", "S", "A"]);
exports.createAttendanceRecordSchema = zod_1.z.object({
  enrollmentId: zod_1.z.string().min(1),
  date: zod_1.z.coerce.date(),
  sessionType: zod_1.z.enum(["Harian", "Mapel"]),
  status: exports.attendanceStatusEnum,
  subjectId: zod_1.z.string().optional(),
  teacherId: zod_1.z.string().optional(),
});
exports.bulkAttendanceSchema = zod_1.z.object({
  classId: zod_1.z.string().min(1),
  termId: zod_1.z.string().optional(),
  records: zod_1.z
    .array(
      zod_1.z.object({
        enrollmentId: zod_1.z.string().min(1),
        date: zod_1.z.string(),
        sessionType: zod_1.z.enum(["Harian", "Mapel"]),
        status: exports.attendanceStatusEnum,
        subjectId: zod_1.z.string().optional(),
      })
    )
    .min(1)
    .max(200),
});
exports.attendanceQuerySchema = zod_1.z.object({
  classId: zod_1.z.string().optional(),
  date: zod_1.z.coerce.date().optional(),
  from: zod_1.z.coerce.date().optional(),
  to: zod_1.z.coerce.date().optional(),
  termId: zod_1.z.string().optional(),
});
//# sourceMappingURL=attendance.js.map
