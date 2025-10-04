import { z } from "zod";
export declare const attendanceStatusEnum: z.ZodEnum<["H", "I", "S", "A"]>;
export declare const createAttendanceRecordSchema: z.ZodObject<
  {
    enrollmentId: z.ZodString;
    date: z.ZodDate;
    sessionType: z.ZodEnum<["Harian", "Mapel"]>;
    status: z.ZodEnum<["H", "I", "S", "A"]>;
    subjectId: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    status: "H" | "I" | "S" | "A";
    date: Date;
    enrollmentId: string;
    sessionType: "Harian" | "Mapel";
    teacherId?: string | undefined;
    subjectId?: string | undefined;
  },
  {
    status: "H" | "I" | "S" | "A";
    date: Date;
    enrollmentId: string;
    sessionType: "Harian" | "Mapel";
    teacherId?: string | undefined;
    subjectId?: string | undefined;
  }
>;
export declare const bulkAttendanceSchema: z.ZodObject<
  {
    classId: z.ZodString;
    termId: z.ZodOptional<z.ZodString>;
    records: z.ZodArray<
      z.ZodObject<
        {
          enrollmentId: z.ZodString;
          date: z.ZodString;
          sessionType: z.ZodEnum<["Harian", "Mapel"]>;
          status: z.ZodEnum<["H", "I", "S", "A"]>;
          subjectId: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          status: "H" | "I" | "S" | "A";
          date: string;
          enrollmentId: string;
          sessionType: "Harian" | "Mapel";
          subjectId?: string | undefined;
        },
        {
          status: "H" | "I" | "S" | "A";
          date: string;
          enrollmentId: string;
          sessionType: "Harian" | "Mapel";
          subjectId?: string | undefined;
        }
      >,
      "many"
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    classId: string;
    records: {
      status: "H" | "I" | "S" | "A";
      date: string;
      enrollmentId: string;
      sessionType: "Harian" | "Mapel";
      subjectId?: string | undefined;
    }[];
    termId?: string | undefined;
  },
  {
    classId: string;
    records: {
      status: "H" | "I" | "S" | "A";
      date: string;
      enrollmentId: string;
      sessionType: "Harian" | "Mapel";
      subjectId?: string | undefined;
    }[];
    termId?: string | undefined;
  }
>;
export declare const attendanceQuerySchema: z.ZodObject<
  {
    classId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodDate>;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
    termId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    date?: Date | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
  },
  {
    date?: Date | undefined;
    classId?: string | undefined;
    termId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
  }
>;
export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
//# sourceMappingURL=attendance.d.ts.map
