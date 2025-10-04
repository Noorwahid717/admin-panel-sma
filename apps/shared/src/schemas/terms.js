"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTermSchema = exports.createTermSchema = void 0;
const zod_1 = require("zod");
exports.createTermSchema = zod_1.z.object({
  name: zod_1.z.string().min(3),
  startDate: zod_1.z.coerce.date(),
  endDate: zod_1.z.coerce.date(),
  active: zod_1.z.boolean().optional(),
});
exports.updateTermSchema = exports.createTermSchema.partial();
//# sourceMappingURL=terms.js.map
