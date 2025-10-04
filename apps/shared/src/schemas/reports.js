"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportPdfJobSchema = exports.reportRequestSchema = void 0;
const zod_1 = require("zod");
exports.reportRequestSchema = zod_1.z.object({
  enrollmentId: zod_1.z.string().min(1),
});
exports.reportPdfJobSchema = zod_1.z.object({
  reportJobId: zod_1.z.string().min(1),
  enrollmentId: zod_1.z.string().min(1),
  requestedBy: zod_1.z.string().min(1),
});
//# sourceMappingURL=reports.js.map
