"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storagePresignSchema = void 0;
const zod_1 = require("zod");
exports.storagePresignSchema = zod_1.z.object({
  fileName: zod_1.z.string().min(3),
  contentType: zod_1.z.string().min(3),
  folder: zod_1.z.string().optional(),
});
//# sourceMappingURL=storage.js.map
