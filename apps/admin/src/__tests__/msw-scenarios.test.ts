import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  calculateScheduleConflicts,
  type ClassSubjectRow,
  type ScheduleRow,
} from "../pages/setup-wizard";
import { calculateWeightedAggregate } from "../pages/grade-config";
import { mswTestUtils } from "../mocks/handlers";

const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
});

afterEach(() => {
  globalThis.localStorage?.clear?.();
  mswTestUtils.setCurrentUser({ role: "SUPERADMIN" });
});

describe("MSW Fixtures", () => {
  it("Jadwal overlap test mendeteksi bentrok pada kelas/ruang yang sama", async () => {
    const classSubjects = mswTestUtils.list("class-subjects") as ClassSubjectRow[];
    const initialSchedules = mswTestUtils.list("schedules") as ScheduleRow[];
    const initialConflicts = calculateScheduleConflicts(initialSchedules, classSubjects);

    expect(initialConflicts).toBeGreaterThanOrEqual(0);

    const referenceSchedule = initialSchedules[0];
    expect(referenceSchedule).toBeTruthy();

    const createdSchedule = mswTestUtils.create("schedules", {
      classSubjectId: referenceSchedule.classSubjectId,
      dayOfWeek: referenceSchedule.dayOfWeek,
      startTime: referenceSchedule.startTime,
      endTime: referenceSchedule.endTime,
      room: referenceSchedule.room,
    } satisfies Partial<ScheduleRow>) as ScheduleRow;
    expect(createdSchedule).toBeTruthy();

    try {
      const updatedSchedules = mswTestUtils.list("schedules") as ScheduleRow[];
      const conflicts = calculateScheduleConflicts(updatedSchedules, classSubjects);

      expect(conflicts).toBeGreaterThan(initialConflicts);
    } finally {
      if (createdSchedule?.id) {
        mswTestUtils.remove("schedules", createdSchedule.id);
      }
    }
  });

  it("Nilai weighted test menghitung skor akhir berbobot sesuai MSW fixtures", async () => {
    const classSubjects = mswTestUtils.list("class-subjects") as ClassSubjectRow[];
    const gradeComponents = mswTestUtils.list("grade-components") as Array<{
      id: string;
      classSubjectId: string;
      weight?: number | string;
    }>;
    const gradeScores = mswTestUtils.list("grades");
    const enrollments = mswTestUtils.list("enrollments");
    const gradeConfigs = mswTestUtils.list("grade-configs");

    const weightedConfig = gradeConfigs.find((item) => item.scheme === "WEIGHTED");
    expect(weightedConfig).toBeTruthy();
    const classSubjectId = weightedConfig?.classSubjectId as string;
    const components = gradeComponents.filter(
      (component) => component.classSubjectId === classSubjectId
    );
    expect(components.length).toBeGreaterThan(0);
    const totalWeight = components.reduce(
      (acc, component) =>
        acc +
        (typeof component.weight === "number" ? component.weight : Number(component.weight ?? 0)),
      0
    );
    expect(totalWeight).toBeGreaterThan(0);

    const targetClassSubject = classSubjects.find((subject) => subject.id === classSubjectId) as
      | ClassSubjectRow
      | undefined;
    expect(targetClassSubject).toBeTruthy();

    const targetEnrollment = enrollments.find(
      (enrollment) => enrollment.classId === targetClassSubject?.classroomId
    );

    expect(targetEnrollment).toBeTruthy();

    const componentScores = components.map((component) => {
      const record = gradeScores.find(
        (score) => score.componentId === component.id && score.enrollmentId === targetEnrollment?.id
      );
      if (!record) {
        return undefined;
      }
      const value =
        typeof record.score === "number" ? record.score : Number.parseFloat(String(record.score));
      return Number.isFinite(value) ? value : undefined;
    });

    const numericComponentScores = componentScores.filter(
      (value): value is number => typeof value === "number"
    );
    expect(numericComponentScores.length).toBe(components.length);

    const finalScore = calculateWeightedAggregate(components, numericComponentScores);

    expect(finalScore).toBeDefined();
    expect(finalScore ?? 0).toBeGreaterThan(0);
    expect(finalScore ?? 0).toBeLessThanOrEqual(100);

    if (typeof weightedConfig?.kkm === "number") {
      expect(finalScore ?? 0).toBeGreaterThanOrEqual(Math.min(50, weightedConfig.kkm - 20));
    }

    const componentAverages = components.map((component) => {
      const values = gradeScores
        .filter((score) => score.componentId === component.id)
        .map((score) => (typeof score.score === "number" ? score.score : Number(score.score)))
        .filter((value) => Number.isFinite(value));

      const sum = values.reduce((acc, value) => acc + value, 0);
      return Number(values.length > 0 ? (sum / values.length).toFixed(2) : 0);
    });

    const previewScore = calculateWeightedAggregate(components, componentAverages);

    expect(previewScore).toBeDefined();
    expect(previewScore ?? 0).toBeGreaterThan(0);
    expect(previewScore ?? 0).toBeLessThanOrEqual(100);
  });

  it("Dashboard Kepsek menampilkan distribusi nilai, outlier, dan daftar remedial", () => {
    const payload = mswTestUtils.getDashboard();
    const students = mswTestUtils.list("students");
    const classes = mswTestUtils.list("classes");

    expect(payload.termId).toMatch(/^term_/);
    expect(payload.distribution?.totalStudents).toBe(students.length);
    expect(payload.distribution?.byClass?.length).toBe(classes.length);
    expect(
      payload.distribution?.byRange?.every(
        (bucket: { count: number }) => typeof bucket.count === "number" && bucket.count >= 0
      )
    ).toBe(true);

    expect(Array.isArray(payload.outliers)).toBe(true);
    expect(payload.outliers.length).toBeGreaterThan(0);
    expect(payload.outliers[0]).toMatchObject({
      studentName: expect.any(String),
      zScore: expect.any(Number),
    });

    expect(Array.isArray(payload.remedial)).toBe(true);
    payload.remedial.forEach((entry: { score: number; kkm: number }) => {
      expect(entry.score).toBeLessThan(entry.kkm);
    });

    expect(payload.attendance?.alerts?.[0]).toMatchObject({
      indicator: "ABSENCE_SPIKE",
    });
  });

  it("Mutasi masuk/keluar menyediakan audit trail lengkap", () => {
    const mutationRecords = mswTestUtils.list("mutations");
    expect(mutationRecords.length).toBeGreaterThan(0);

    const types = new Set(mutationRecords.map((item) => item.type));
    expect(types.size).toBeGreaterThan(1);

    mutationRecords.forEach((record) => {
      expect(record.auditTrail?.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(record.auditTrail?.[0]).toMatchObject({
        action: expect.any(String),
        actorName: expect.any(String),
      });
    });
  });

  it("Arsip rapor & absensi tersedia dengan metadata file", () => {
    const archiveRecords = mswTestUtils.list("archives");
    expect(archiveRecords.length).toBeGreaterThanOrEqual(3);

    const raporArchive = archiveRecords.find((item) => item.type === "REPORT_PDF");
    expect(raporArchive).toMatchObject({
      fileName: expect.stringContaining("rapor"),
      format: expect.stringMatching(/zip|pdf/),
      downloadUrl: expect.stringContaining("https://"),
    });

    const attendanceArchive = archiveRecords.find((item) => item.type === "ATTENDANCE_CSV");
    expect(attendanceArchive?.format).toBe("csv");
    expect(typeof attendanceArchive?.fileSize).toBe("number");
  });

  it("Kalender akademik MSW menyediakan event lintas kategori serta jadwal ujian terintegrasi", () => {
    const calendarEvents = mswTestUtils.list("calendar-events") as Array<{
      id: string;
      category: string;
      startDate: string;
      termId?: string;
    }>;
    expect(Array.isArray(calendarEvents)).toBe(true);
    expect(calendarEvents.length).toBeGreaterThan(0);

    const categorySet = new Set(calendarEvents.map((event) => event.category));
    [
      "EFFECTIVE_DAY",
      "HOLIDAY",
      "MEETING",
      "EXTRACURRICULAR",
      "INACTIVE_DAY",
      "SCHOOL_ACTIVITY",
    ].forEach((category) => {
      expect(categorySet.has(category)).toBe(true);
    });

    const examEvents = mswTestUtils.list("exam-events") as Array<{
      id: string;
      examType: string;
      startDate: string;
      termId?: string;
    }>;
    expect(examEvents.length).toBeGreaterThanOrEqual(4);
    const ptsExam = examEvents.find((event) => event.examType === "PTS");
    expect(ptsExam).toBeTruthy();

    const manualHoliday = calendarEvents.find((event) => event.id === "cal_libur_kemerdekaan");
    expect(manualHoliday?.startDate).toContain("2024-08-17");

    const created = mswTestUtils.create("calendar-events", {
      title: "Uji Coba Event Kalender",
      category: "SCHOOL_ACTIVITY",
      startDate: "2024-09-01",
      endDate: "2024-09-01",
      termId: manualHoliday?.termId,
      allDay: true,
    }) as { id: string; startDate: string; category: string };

    expect(created).toBeTruthy();
    expect(created.category).toBe("SCHOOL_ACTIVITY");
    expect(created.startDate).toContain("2024-09-01");

    mswTestUtils.remove("calendar-events", created.id);
  });

  it("Dataset absensi mapel menyertakan slot jam pelajaran dan timestamp pembaruan", () => {
    const schedules = mswTestUtils.list("schedules") as Array<{
      id: string;
      slot?: number;
    }>;
    expect(schedules.length).toBeGreaterThan(0);
    schedules.forEach((schedule) => {
      expect(typeof schedule.slot).toBe("number");
    });

    const attendanceRecords = mswTestUtils.list("attendance") as Array<{
      id: string;
      enrollmentId: string;
      classId: string;
      date: string;
      sessionType?: string;
      slot?: number;
      recordedAt?: string;
      updatedAt?: string;
      subjectId?: string;
      teacherId?: string;
      status: string;
    }>;

    const mapelRecord = attendanceRecords.find((record) => record.sessionType === "Mapel");
    expect(mapelRecord).toBeTruthy();
    expect(typeof mapelRecord?.slot).toBe("number");
    expect(typeof mapelRecord?.recordedAt).toBe("string");
    expect(typeof mapelRecord?.updatedAt).toBe("string");

    if (!mapelRecord) {
      throw new Error("Tes membutuhkan minimal satu record absensi mapel.");
    }

    const created = mswTestUtils.create("attendance", {
      enrollmentId: mapelRecord.enrollmentId,
      classId: mapelRecord.classId,
      date: mapelRecord.date,
      status: "H",
      sessionType: "Mapel",
      subjectId: mapelRecord.subjectId,
      teacherId: mapelRecord.teacherId,
      slot: mapelRecord.slot,
      note: "Uji coba penyimpanan",
    }) as { id: string; slot?: number };

    expect(created).toBeTruthy();
    expect(created.slot).toBe(mapelRecord.slot);

    const removed = mswTestUtils.remove("attendance", created.id);
    expect(removed?.id).toBe(created.id);
  });

  it("Helper rekap absensi mengembalikan ringkasan status dan alfa mingguan", () => {
    const classes = mswTestUtils.list("classes");
    expect(classes.length).toBeGreaterThan(0);
    const summary = mswTestUtils.getAttendanceSummary({ classId: classes[0].id });

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.byStatus.H + summary.byStatus.I + summary.byStatus.S + summary.byStatus.A).toBe(
      summary.total
    );
    const weeklyAlphaKeys = Object.keys(summary.weeklyAlpha);
    expect(weeklyAlphaKeys.length).toBeGreaterThan(0);
    weeklyAlphaKeys.forEach((weekKey) => {
      expect(summary.weeklyAlpha[weekKey]).toBeGreaterThanOrEqual(0);
    });
  });

  it("Tersedia akun MSW untuk setiap peran utama", () => {
    const roles = [
      "SUPERADMIN",
      "ADMIN_TU",
      "KEPALA_SEKOLAH",
      "WALI_KELAS",
      "GURU_MAPEL",
      "SISWA",
      "ORTU",
    ];

    roles.forEach((role) => {
      const user = mswTestUtils.setCurrentUser({ role });
      expect(user.role).toBe(role);
      expect(user.email).toContain("@");
    });

    const users = mswTestUtils.listUsers();
    expect(users).toHaveLength(roles.length);
  });
});
