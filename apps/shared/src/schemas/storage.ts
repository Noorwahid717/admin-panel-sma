import { z } from "zod";

export const storagePresignSchema = z.object({
  fileName: z.string().min(3),
  contentType: z.string().min(3),
  folder: z.string().optional(),
});

export type StoragePresignInput = z.infer<typeof storagePresignSchema>;
