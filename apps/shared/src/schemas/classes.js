"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classQuerySchema = exports.updateClassSchema = exports.createClassSchema = void 0;
const zod_1 = require("zod");
exports.createClassSchema = zod_1.z.object({
  name: zod_1.z.string().min(2),
  level: zod_1.z.number().int().min(10).max(12),
  homeroomId: zod_1.z.string().optional(),
});
exports.updateClassSchema = exports.createClassSchema.partial();
exports.classQuerySchema = zod_1.z.object({
  level: zod_1.z.coerce.number().int().min(10).max(12).optional(),
  homeroomId: zod_1.z.string().optional(),
  termId: zod_1.z.string().optional(),
  search: zod_1.z.string().min(1).optional(),
  cursor: zod_1.z.string().optional(),
  limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
//# sourceMappingURL=classes.js.map
