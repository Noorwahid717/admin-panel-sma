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

    expect(initialConflicts).toBe(0);

    const createdSchedule = mswTestUtils.create("schedules", {
      classSubjectId: "cs_xipa_mat",
      dayOfWeek: 1,
      startTime: "09:10",
      endTime: "10:00",
      room: "Ruang 101",
    } satisfies Partial<ScheduleRow>) as ScheduleRow;
    expect(createdSchedule).toBeTruthy();

    try {
      const updatedSchedules = mswTestUtils.list("schedules") as ScheduleRow[];
      const conflicts = calculateScheduleConflicts(updatedSchedules, classSubjects);

      expect(conflicts).toBe(initialConflicts + 1);
    } finally {
      if (createdSchedule?.id) {
        mswTestUtils.remove("schedules", createdSchedule.id);
      }
    }
  });

  it("Nilai weighted test menghitung skor akhir berbobot sesuai MSW fixtures", async () => {
    const classSubjectId = "cs_xipa_mat";
    const gradeComponents = mswTestUtils
      .list("grade-components")
      .filter((component) => component.classSubjectId === classSubjectId) as Array<{
      id: string;
      weight?: number | string;
    }>;
    const gradeScores = mswTestUtils.list("grades");
    const enrollments = mswTestUtils.list("enrollments");
    const gradeConfigs = mswTestUtils.list("grade-configs");

    expect(gradeComponents.length).toBeGreaterThan(0);

    const targetEnrollment = enrollments.find((enrollment) => enrollment.id === "enr_aditya_xipa");

    expect(targetEnrollment).toBeTruthy();

    const componentScores = gradeComponents.map((component) => {
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

    const finalScore = calculateWeightedAggregate(gradeComponents, componentScores);

    expect(finalScore).toBeDefined();
    expect(finalScore).toBeCloseTo(85.6, 1);

    const config = gradeConfigs.find((item) => item.classSubjectId === classSubjectId);
    expect(config?.scheme).toBe("WEIGHTED");
    if (typeof config?.kkm === "number") {
      expect(finalScore ?? 0).toBeGreaterThanOrEqual(config.kkm);
    }

    const componentAverages = gradeComponents.map((component) => {
      const values = gradeScores
        .filter((score) => score.componentId === component.id)
        .map((score) => (typeof score.score === "number" ? score.score : Number(score.score)))
        .filter((value) => Number.isFinite(value));

      const sum = values.reduce((acc, value) => acc + value, 0);
      return Number(values.length > 0 ? (sum / values.length).toFixed(2) : 0);
    });

    const previewScore = calculateWeightedAggregate(gradeComponents, componentAverages);

    expect(previewScore).toBeDefined();
    expect(previewScore).toBeGreaterThan(finalScore ?? 0);
    expect(previewScore).toBeCloseTo(88.4, 1);
  });

  it("Dashboard Kepsek menampilkan distribusi nilai, outlier, dan daftar remedial", () => {
    const payload = mswTestUtils.getDashboard();
    expect(payload.termId).toBe("term_2024_ganjil");
    expect(payload.distribution?.byRange?.length).toBeGreaterThan(0);
    const lowerBucket = payload.distribution.byRange.find(
      (bucket: { range: string }) => bucket.range === "<70"
    );
    expect(lowerBucket?.count).toBe(10);

    expect(Array.isArray(payload.outliers)).toBe(true);
    expect(payload.outliers[0]).toMatchObject({
      studentName: expect.any(String),
      zScore: expect.any(Number),
    });

    expect(Array.isArray(payload.remedial)).toBe(true);
    const remedialEntry = payload.remedial.find(
      (item: { studentId: string }) => item.studentId === "stu_raffael_putra"
    );
    expect(remedialEntry).toMatchObject({
      subjectName: "Sosiologi",
      score: expect.any(Number),
      kkm: expect.any(Number),
    });

    expect(payload.attendance?.alerts?.[0]).toMatchObject({
      classId: "class_xi_ips_1",
      indicator: "ABSENCE_SPIKE",
    });
  });

  it("Mutasi masuk/keluar menyediakan audit trail lengkap", () => {
    const mutationRecords = mswTestUtils.list("mutations");
    expect(mutationRecords.length).toBeGreaterThanOrEqual(3);

    const outgoing = mutationRecords.find((item) => item.type === "OUT");
    expect(outgoing).toBeTruthy();
    expect(outgoing?.auditTrail?.length).toBeGreaterThanOrEqual(3);
    expect(outgoing?.auditTrail?.[0]).toMatchObject({
      action: expect.stringContaining("REQUEST"),
      actorName: "Super Admin",
    });

    const internal = mutationRecords.find((item) => item.type === "INTERNAL");
    expect(internal?.auditTrail?.some((entry: any) => entry.action === "SCHEDULE_UPDATED")).toBe(
      true
    );
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
