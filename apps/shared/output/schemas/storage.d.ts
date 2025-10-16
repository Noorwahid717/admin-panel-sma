import { z } from "zod";
export declare const storagePresignSchema: z.ZodObject<
  {
    fileName: z.ZodString;
    contentType: z.ZodString;
    folder: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    fileName: string;
    contentType: string;
    folder?: string | undefined;
  },
  {
    fileName: string;
    contentType: string;
    folder?: string | undefined;
  }
>;
export type StoragePresignInput = z.infer<typeof storagePresignSchema>;
