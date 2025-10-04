import { z } from "zod";
export declare const createScheduleEntrySchema: z.ZodObject<
  {
    classId: z.ZodString;
    subjectId: z.ZodString;
    teacherId: z.ZodString;
    dayOfWeek: z.ZodNumber;
    startTime: z.ZodString;
    endTime: z.ZodString;
    termId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    teacherId: string;
    classId: string;
    subjectId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    termId?: string | undefined;
  },
  {
    teacherId: string;
    classId: string;
    subjectId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    termId?: string | undefined;
  }
>;
export declare const updateScheduleEntrySchema: z.ZodObject<
  {
    classId: z.ZodOptional<z.ZodString>;
    subjectId: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodString>;
    dayOfWeek: z.ZodOptional<z.ZodNumber>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    termId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    teacherId?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
    dayOfWeek?: number | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
  },
  {
    teacherId?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
    dayOfWeek?: number | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
  }
>;
export declare const scheduleQuerySchema: z.ZodObject<
  {
    classId: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodString>;
    subjectId: z.ZodOptional<z.ZodString>;
    termId: z.ZodOptional<z.ZodString>;
    dayOfWeek: z.ZodOptional<z.ZodNumber>;
  },
  "strip",
  z.ZodTypeAny,
  {
    teacherId?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
    dayOfWeek?: number | undefined;
  },
  {
    teacherId?: string | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    subjectId?: string | undefined;
    dayOfWeek?: number | undefined;
  }
>;
export type CreateScheduleEntryInput = z.infer<typeof createScheduleEntrySchema>;
export type UpdateScheduleEntryInput = z.infer<typeof updateScheduleEntrySchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
//# sourceMappingURL=schedule.d.ts.map
