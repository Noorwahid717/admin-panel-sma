import { z } from "zod";
export declare const createTermSchema: z.ZodObject<
  {
    name: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    active: z.ZodOptional<z.ZodBoolean>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name: string;
    startDate: Date;
    endDate: Date;
    active?: boolean | undefined;
  },
  {
    name: string;
    startDate: Date;
    endDate: Date;
    active?: boolean | undefined;
  }
>;
export declare const updateTermSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    active: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    active?: boolean | undefined;
  },
  {
    name?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    active?: boolean | undefined;
  }
>;
export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
//# sourceMappingURL=terms.d.ts.map
