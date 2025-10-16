import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useDataProvider,
  useList,
  useNotification,
  type BaseRecord,
  type HttpError,
} from "@refinedev/core";
import dayjs from "dayjs";

const DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
];

const SLOTS = Array.from({ length: 8 }, (_, index) => index + 1);

export type GeneratorFilters = {
  termId?: string;
  classId?: string;
};

export type ScheduleSlot = {
  id: string;
  classId: string;
  dayOfWeek: number;
  slot: number;
  teacherId: string | null;
  subjectId: string | null;
  status: "EMPTY" | "PREFERENCE" | "COMPROMISE" | "CONFLICT";
  locked?: boolean;
};

export type TeacherPreference = {
  id: string;
  teacherId: string;
  preferredDays: number[];
  blockedDays: number[];
  preferredSlots: number[];
  maxDailySessions: number;
  availabilityLevel: "HIGH" | "MEDIUM" | "LOW";
  notes: string;
};

export type TeacherCard = {
  id: string;
  name: string;
  subjectNames: string[];
  availabilityLevel: TeacherPreference["availabilityLevel"];
  preferredSummary: string;
  assignedCount: number;
  totalSessions: number;
  color: "success" | "warning" | "error";
};

export type DaySchedule = {
  value: number;
  label: string;
  slots: Array<ScheduleSlot & { key: string }>;
};

export type FairnessEntry = {
  teacherId: string;
  teacherName: string;
  daysCount: number;
  sessionCount: number;
  availabilityLevel: TeacherPreference["availabilityLevel"];
};

export type GenerateSummary = {
  preferenceMatches: number;
  compromise: number;
  conflicts: number;
  empty: number;
  confidence: number;
};

const buildSlotKey = (day: number, slot: number) => `${day}-${slot}`;

const slotKeyToParts = (key: string) => {
  const [day, slot] = key.split("-").map((value) => Number(value));
  return { dayOfWeek: day, slot };
};

const formatPreferredSummary = (preference?: TeacherPreference) => {
  if (!preference) {
    return "Tidak ada preferensi khusus";
  }
  const days = preference.preferredDays
    .map((day) => DAYS.find((item) => item.value === day)?.label ?? `Hari ${day}`)
    .join(", ");
  const slots = preference.preferredSlots.map((slot) => `Jam ${slot}`).join(", ");
  return `${days || "Semua hari"} · ${slots || "Semua jam"}`;
};

const AVAILABILITY_COLORS: Record<TeacherPreference["availabilityLevel"], TeacherCard["color"]> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "error",
};

export const useScheduleGenerator = (filters: GeneratorFilters) => {
  const dataProvider = useDataProvider();
  const { open: notify } = useNotification();

  const termsQuery = useList<{ id: string; name: string; semester?: number; year?: string }>({
    resource: "terms",
    pagination: { current: 1, pageSize: 50 },
    sorters: [{ field: "startDate", order: "asc" }],
  });

  const teachersQuery = useList<{ id: string; fullName: string }>({
    resource: "teachers",
    pagination: { current: 1, pageSize: 200 },
  });

  const subjectsQuery = useList<{ id: string; name: string }>({
    resource: "subjects",
    pagination: { current: 1, pageSize: 200 },
  });

  const classesQuery = useList<{ id: string; name: string; termId: string }>({
    resource: "classes",
    pagination: { current: 1, pageSize: 200 },
  });

  const classSubjectsQuery = useList<{
    id: string;
    classroomId: string;
    subjectId: string;
    teacherId: string;
  }>({
    resource: "class-subjects",
    pagination: { current: 1, pageSize: 500 },
  });

  const preferencesQuery = useList<TeacherPreference>({
    resource: "teacher-preferences",
    pagination: { current: 1, pageSize: 200 },
  });

  const semesterScheduleQuery = useList<ScheduleSlot>({
    resource: "semester-schedule",
    pagination: { current: 1, pageSize: 5000 },
  });

  const selectedClass = useMemo(() => {
    if (!filters.classId) {
      return null;
    }
    return classesQuery.data?.data?.find((klass) => klass.id === filters.classId) ?? null;
  }, [classesQuery.data?.data, filters.classId]);

  const teacherPreferences = useMemo(
    () => preferencesQuery.data?.data ?? [],
    [preferencesQuery.data?.data]
  );

  const teachers = useMemo(() => teachersQuery.data?.data ?? [], [teachersQuery.data?.data]);
  const subjects = useMemo(() => subjectsQuery.data?.data ?? [], [subjectsQuery.data?.data]);
  const classSubjects = useMemo(
    () => classSubjectsQuery.data?.data ?? [],
    [classSubjectsQuery.data?.data]
  );
  const semesterSlots = useMemo(
    () => semesterScheduleQuery.data?.data ?? [],
    [semesterScheduleQuery.data?.data]
  );

  const teacherPreferenceMap = useMemo(() => {
    const map = new Map<string, TeacherPreference>();
    teacherPreferences.forEach((pref) => map.set(pref.teacherId, pref));
    return map;
  }, [teacherPreferences]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((subject) => map.set(subject.id, subject.name));
    return map;
  }, [subjects]);

  const classSubjectByTeacher = useMemo(() => {
    if (!filters.classId) {
      return new Map<string, { subjectId: string; classSubjectId: string }[]>();
    }
    const map = new Map<string, { subjectId: string; classSubjectId: string }[]>();
    classSubjects
      .filter((mapping) => mapping.classroomId === filters.classId)
      .forEach((mapping) => {
        const list = map.get(mapping.teacherId) ?? [];
        list.push({ subjectId: mapping.subjectId, classSubjectId: mapping.id });
        map.set(mapping.teacherId, list);
      });
    return map;
  }, [classSubjects, filters.classId]);

  const [slotState, setSlotState] = useState<Record<string, ScheduleSlot>>({});
  const [hoveredTeacherId, setHoveredTeacherId] = useState<string | null>(null);
  const [generateSummary, setGenerateSummary] = useState<GenerateSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initialiseSlots = useCallback((slots: ScheduleSlot[]) => {
    const map: Record<string, ScheduleSlot> = {};
    slots.forEach((slot) => {
      const key = buildSlotKey(slot.dayOfWeek, slot.slot);
      map[key] = { ...slot };
    });
    setSlotState(map);
  }, []);

  useEffect(() => {
    if (!filters.classId) {
      setSlotState({});
      return;
    }
    const matchingSlots = semesterSlots.filter((slot) => slot.classId === filters.classId);
    if (matchingSlots.length > 0) {
      initialiseSlots(matchingSlots);
    } else {
      setSlotState({});
    }
  }, [filters.classId, initialiseSlots, semesterSlots]);

  const evaluateSlots = useCallback(
    (currentSlots: Record<string, ScheduleSlot>) => {
      const teacherDailyLoad = new Map<string, Record<number, number>>();

      Object.values(currentSlots).forEach((slot) => {
        if (!slot.teacherId || slot.status === "EMPTY") {
          return;
        }
        const load = teacherDailyLoad.get(slot.teacherId) ?? {};
        load[slot.dayOfWeek] = (load[slot.dayOfWeek] ?? 0) + 1;
        teacherDailyLoad.set(slot.teacherId, load);
      });

      const evaluated: Record<string, ScheduleSlot> = {};

      Object.entries(currentSlots).forEach(([key, slot]) => {
        if (!slot.teacherId || !slot.subjectId) {
          evaluated[key] = { ...slot, status: "EMPTY" };
          return;
        }
        const preference = teacherPreferenceMap.get(slot.teacherId);
        const preferredDay = preference ? preference.preferredDays.includes(slot.dayOfWeek) : false;
        const preferredSlot = preference ? preference.preferredSlots.includes(slot.slot) : false;
        const blocked = preference ? preference.blockedDays.includes(slot.dayOfWeek) : false;
        const dailyLoad = teacherDailyLoad.get(slot.teacherId);
        const overload =
          dailyLoad && preference
            ? (dailyLoad[slot.dayOfWeek] ?? 0) > preference.maxDailySessions
            : false;

        let status: ScheduleSlot["status"] = "PREFERENCE";
        if (blocked || overload) {
          status = "CONFLICT";
        } else if (!(preferredDay && preferredSlot)) {
          status = "COMPROMISE";
        }

        evaluated[key] = { ...slot, status };
      });

      return evaluated;
    },
    [teacherPreferenceMap]
  );

  const teacherCards = useMemo<TeacherCard[]>(() => {
    return teachers.map((teacher) => {
      const preference = teacherPreferenceMap.get(teacher.id);
      const assignments = Object.values(slotState).filter((slot) => slot.teacherId === teacher.id);
      const subjectNames = (classSubjectByTeacher.get(teacher.id) ?? [])
        .map((item) => subjectMap.get(item.subjectId) ?? "Mapel")
        .filter((value, index, self) => self.indexOf(value) === index);
      return {
        id: teacher.id,
        name: teacher.fullName,
        subjectNames,
        availabilityLevel: preference?.availabilityLevel ?? "HIGH",
        preferredSummary: formatPreferredSummary(preference),
        assignedCount: assignments.length,
        totalSessions: classSubjectByTeacher.get(teacher.id)?.length ?? 0,
        color: AVAILABILITY_COLORS[preference?.availabilityLevel ?? "HIGH"],
      };
    });
  }, [classSubjectByTeacher, slotState, subjectMap, teacherPreferenceMap, teachers]);

  const daySchedules = useMemo<DaySchedule[]>(() => {
    const evaluated = evaluateSlots(slotState);
    return DAYS.map((day) => {
      const slots = SLOTS.map((slot) => {
        const key = buildSlotKey(day.value, slot);
        const assignment = evaluated[key];
        if (assignment) {
          return { ...assignment, key };
        }
        return {
          id: `slot_${day.value}_${slot}`,
          classId: filters.classId ?? "",
          dayOfWeek: day.value,
          slot,
          teacherId: null,
          subjectId: null,
          status: "EMPTY" as const,
          locked: false,
          key,
        };
      });
      return { value: day.value, label: day.label, slots };
    });
  }, [evaluateSlots, filters.classId, slotState]);

  const fairnessSummary = useMemo<FairnessEntry[]>(() => {
    const uniqueDaysByTeacher = new Map<string, Set<number>>();
    const sessionCount = new Map<string, number>();

    Object.values(slotState).forEach((slot) => {
      if (!slot.teacherId || slot.status === "EMPTY") {
        return;
      }
      const daysSet = uniqueDaysByTeacher.get(slot.teacherId) ?? new Set<number>();
      daysSet.add(slot.dayOfWeek);
      uniqueDaysByTeacher.set(slot.teacherId, daysSet);
      sessionCount.set(slot.teacherId, (sessionCount.get(slot.teacherId) ?? 0) + 1);
    });

    return teacherCards.map((card) => {
      const days = uniqueDaysByTeacher.get(card.id)?.size ?? 0;
      const sessions = sessionCount.get(card.id) ?? 0;
      return {
        teacherId: card.id,
        teacherName: card.name,
        daysCount: days,
        sessionCount: sessions,
        availabilityLevel: card.availabilityLevel,
      };
    });
  }, [slotState, teacherCards]);

  const assignTeacherToSlot = useCallback(
    (teacherId: string, slotKey: string) => {
      const mapping = classSubjectByTeacher.get(teacherId)?.[0];
      setSlotState((prev) => {
        const next = { ...prev };
        const { dayOfWeek, slot } = slotKeyToParts(slotKey);
        const existing = next[slotKey] ?? {
          id: `slot_${dayOfWeek}_${slot}`,
          classId: filters.classId ?? "",
          dayOfWeek,
          slot,
          teacherId: null,
          subjectId: null,
          status: "EMPTY" as const,
        };
        next[slotKey] = {
          ...existing,
          teacherId,
          subjectId: mapping?.subjectId ?? null,
        };
        return evaluateSlots(next);
      });
    },
    [classSubjectByTeacher, evaluateSlots, filters.classId]
  );

  const clearSlot = useCallback(
    (slotKey: string) => {
      setSlotState((prev) => {
        if (!prev[slotKey]) {
          return prev;
        }
        const next = { ...prev };
        next[slotKey] = {
          ...next[slotKey],
          teacherId: null,
          subjectId: null,
          status: "EMPTY",
          locked: false,
        };
        return evaluateSlots(next);
      });
    },
    [evaluateSlots]
  );

  const toggleLock = useCallback((slotKey: string) => {
    setSlotState((prev) => {
      const next = { ...prev };
      if (!next[slotKey]) {
        return prev;
      }
      next[slotKey] = { ...next[slotKey], locked: !next[slotKey].locked };
      return next;
    });
  }, []);

  const generateSchedule = useCallback(async () => {
    if (!filters.classId) {
      notify?.({
        type: "warning",
        message: "Pilih kelas terlebih dahulu",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const response = await dataProvider.custom<{
        slots: ScheduleSlot[];
        summary: GenerateSummary;
      }>({
        url: "/schedule/generate",
        method: "post",
        payload: { classId: filters.classId, termId: filters.termId },
      });
      const slots = response?.data?.slots ?? [];
      const summary = response?.data?.summary ?? null;
      if (slots.length > 0) {
        initialiseSlots(slots);
      }
      setGenerateSummary(summary);
      if (summary) {
        notify?.({
          type: "success",
          message: "Jadwal otomatis dibuat",
          description: `Kesesuaian preferensi ${summary.confidence.toFixed(1)}%`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat jadwal";
      notify?.({ type: "error", message });
    } finally {
      setIsGenerating(false);
    }
  }, [dataProvider, filters.classId, filters.termId, initialiseSlots, notify]);

  const saveSchedule = useCallback(async () => {
    if (!filters.classId) {
      notify?.({
        type: "warning",
        message: "Pilih kelas terlebih dahulu",
      });
      return;
    }
    setIsSaving(true);
    try {
      const payload = Object.values(slotState);
      await dataProvider.custom({
        url: "/schedule/save",
        method: "post",
        payload: {
          classId: filters.classId,
          slots: payload,
        },
      });
      notify?.({ type: "success", message: "Jadwal berhasil disimpan" });
    } catch (error) {
      const message = (error as HttpError)?.message ?? "Gagal menyimpan jadwal";
      notify?.({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  }, [dataProvider, filters.classId, notify, slotState]);

  const terms = useMemo(() => termsQuery.data?.data ?? [], [termsQuery.data?.data]);

  const isLoading =
    termsQuery.isLoading ||
    teachersQuery.isLoading ||
    subjectsQuery.isLoading ||
    classesQuery.isLoading ||
    classSubjectsQuery.isLoading ||
    preferencesQuery.isLoading ||
    semesterScheduleQuery.isLoading;

  const isFetching =
    termsQuery.isFetching ||
    teachersQuery.isFetching ||
    subjectsQuery.isFetching ||
    classesQuery.isFetching ||
    classSubjectsQuery.isFetching ||
    preferencesQuery.isFetching ||
    semesterScheduleQuery.isFetching;

  return {
    isLoading,
    isFetching,
    isGenerating,
    isSaving,
    terms,
    classes: classesQuery.data?.data ?? [],
    subjects,
    teachers: teacherCards,
    preferences: teacherPreferences,
    daySchedules,
    hoveredTeacherId,
    setHoveredTeacherId,
    assignTeacherToSlot,
    clearSlot,
    toggleLock,
    generateSchedule,
    saveSchedule,
    fairnessSummary,
    generateSummary,
  };
};
