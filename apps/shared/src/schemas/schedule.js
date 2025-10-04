"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleQuerySchema =
  exports.updateScheduleEntrySchema =
  exports.createScheduleEntrySchema =
    void 0;
const zod_1 = require("zod");
exports.createScheduleEntrySchema = zod_1.z.object({
  classId: zod_1.z.string().min(1),
  subjectId: zod_1.z.string().min(1),
  teacherId: zod_1.z.string().min(1),
  dayOfWeek: zod_1.z.number().int().min(1).max(6),
  startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
  endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
  termId: zod_1.z.string().optional(),
});
exports.updateScheduleEntrySchema = exports.createScheduleEntrySchema.partial();
exports.scheduleQuerySchema = zod_1.z.object({
  classId: zod_1.z.string().optional(),
  teacherId: zod_1.z.string().optional(),
  subjectId: zod_1.z.string().optional(),
  termId: zod_1.z.string().optional(),
  dayOfWeek: zod_1.z.coerce.number().int().min(1).max(6).optional(),
});
//# sourceMappingURL=schedule.js.map
