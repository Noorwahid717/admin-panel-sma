"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectQuerySchema = exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
exports.createSubjectSchema = zod_1.z.object({
  code: zod_1.z.string().min(2),
  name: zod_1.z.string().min(2),
});
exports.updateSubjectSchema = exports.createSubjectSchema.partial();
exports.subjectQuerySchema = zod_1.z.object({
  search: zod_1.z.string().optional(),
  limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
  cursor: zod_1.z.string().optional(),
});
//# sourceMappingURL=subjects.js.map
