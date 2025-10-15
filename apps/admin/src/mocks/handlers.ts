import { http, HttpResponse } from "msw";
import { createSeedData } from "./seed";

/**
 * Skenario MSW: SMA Negeri Harapan Nusantara (TP 2024/2025)
 *
 * Dataset dihasilkan melalui generator seed agar merepresentasikan kondisi realistis:
 * - 2 term akademik
 * - 15 mata pelajaran
 * - 10 kelas aktif (X-XII, IPA & IPS)
 * - ±300 siswa dengan status dan wali
 * - Jadwal, nilai, absensi, mutasi, arsip, dan dashboard kepala sekolah
 */

const seed = createSeedData();

const terms = [...seed.terms];
const subjects = [...seed.subjects];
const teachers = [...seed.teachers];
const classes = [...seed.classes];
const students = [...seed.students];
const enrollments = [...seed.enrollments];
const classSubjects = [...seed.classSubjects];
const schedules = [...seed.schedules];
const gradeComponents = [...seed.gradeComponents];
const gradeConfigs = [...seed.gradeConfigs];
const grades = [...seed.grades];
const attendance = [...seed.attendance];
const announcements = [...seed.announcements];
const behaviorNotes = [...seed.behaviorNotes];
const mutations = [...seed.mutations];
const archives = [...seed.archives];
const principalDashboard = { ...seed.dashboard };
type MockUserRecord = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role:
    | "SUPERADMIN"
    | "ADMIN_TU"
    | "KEPALA_SEKOLAH"
    | "WALI_KELAS"
    | "GURU_MAPEL"
    | "SISWA"
    | "ORTU";
  teacherId?: string | null;
  studentId?: string | null;
  classId?: string | null;
};

const DEFAULT_PASSWORD = "Admin123!";

const toLocalPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

const homeroomClass = classes.find((klass) => klass.id === "class_x_ipa_1") ?? classes[0];
const homeroomTeacher =
  teachers.find((teacher) => teacher.id === homeroomClass?.homeroomId) ?? teachers[0];
const mathSubject = subjects.find((subject) => subject.code === "MAT") ?? subjects[0];
const mathTeacher =
  teachers.find((teacher) => teacher.mainSubjectId === mathSubject.id) ?? teachers[1];
const principalTeacher =
  teachers.find((teacher) => teacher.fullName.toLowerCase().includes("surya")) ?? teachers[2];
const sampleStudent =
  students.find((student) => student.id === "stu_aditya_wijaya") ??
  students.find((student) => student.status === "active") ??
  students[0];
const sampleClass = classes.find((klass) => klass.id === sampleStudent.classId) ?? classes[0];
const guardianName = sampleStudent.guardian ?? "Orang Tua";
const guardianEmailLocal = `${toLocalPart(guardianName)}.${toLocalPart(sampleStudent.fullName.split(" ").slice(-1)[0] ?? "wali")}`;

const mockUsers: MockUserRecord[] = [
  {
    id: "user_superadmin",
    email: "superadmin@harapannusantara.sch.id",
    password: DEFAULT_PASSWORD,
    fullName: "Super Admin",
    role: "SUPERADMIN",
  },
  {
    id: "user_admin_tu",
    email: "admin.tu@harapannusantara.sch.id",
    password: DEFAULT_PASSWORD,
    fullName: "Admin Tata Usaha",
    role: "ADMIN_TU",
  },
  {
    id: "user_kepsek",
    email: "kepsek@harapannusantara.sch.id",
    password: DEFAULT_PASSWORD,
    fullName: principalTeacher.fullName.replace(/^Pak |^Ibu /, "Drs. "),
    role: "KEPALA_SEKOLAH",
    teacherId: principalTeacher.id,
  },
  {
    id: "user_wali_kelas",
    email: `wali.${toLocalPart(homeroomClass.code)}@harapannusantara.sch.id`,
    password: DEFAULT_PASSWORD,
    fullName: homeroomTeacher.fullName.replace(/^Pak |^Ibu /, ""),
    role: "WALI_KELAS",
    teacherId: homeroomTeacher.id,
    classId: homeroomClass.id,
  },
  {
    id: "user_guru_mapel",
    email: `guru.${toLocalPart(mathSubject.code)}@harapannusantara.sch.id`,
    password: DEFAULT_PASSWORD,
    fullName: mathTeacher.fullName.replace(/^Pak |^Ibu /, ""),
    role: "GURU_MAPEL",
    teacherId: mathTeacher.id,
  },
  {
    id: "user_siswa",
    email: `${toLocalPart(sampleStudent.fullName)}@harapannusantara.sch.id`,
    password: DEFAULT_PASSWORD,
    fullName: sampleStudent.fullName,
    role: "SISWA",
    studentId: sampleStudent.id,
    classId: sampleClass.id,
  },
  {
    id: "user_ortu",
    email: `${guardianEmailLocal}@harapannusantara.sch.id`,
    password: DEFAULT_PASSWORD,
    fullName: guardianName,
    role: "ORTU",
    studentId: sampleStudent.id,
    classId: sampleClass.id,
  },
];

const sanitizeUser = (user: MockUserRecord) => {
  const { password: _password, ...rest } = user;
  return rest;
};

let currentUser = sanitizeUser(mockUsers[0]);

const findUserByEmail = (email: string | null | undefined) => {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return mockUsers.find((user) => user.email.toLowerCase() === normalized);
};

const findUserByRole = (role: string | null | undefined) => {
  if (!role) return undefined;
  const normalized = role.trim().toUpperCase();
  return mockUsers.find((user) => user.role === normalized);
};

const resourceKeys = [
  "students",
  "teachers",
  "classes",
  "subjects",
  "terms",
  "enrollments",
  "grade-components",
  "grade-configs",
  "grades",
  "attendance",
  "class-subjects",
  "schedules",
  "announcements",
  "behavior-notes",
  "mutations",
  "archives",
  "dashboard",
] as const;

export type ResourceKey = (typeof resourceKeys)[number];

const stores: Record<ResourceKey, Record<string, any>[]> = {
  students,
  teachers,
  classes,
  subjects,
  terms,
  enrollments,
  "grade-components": gradeComponents,
  "grade-configs": gradeConfigs,
  grades,
  attendance,
  "class-subjects": classSubjects,
  schedules,
  announcements,
  "behavior-notes": behaviorNotes,
  mutations,
  archives,
  dashboard: [principalDashboard],
};

const resourcePathRegex =
  /\/(?:api(?:\/v1)?)?\/?(students|teachers|classes|subjects|terms|enrollments|grade-components|grade-configs|grades|attendance|class-subjects|schedules|announcements|behavior-notes|mutations|archives|dashboard)(?:\/([^/?]+))?\/?$/;

const parseResourceRequest = (request: Request) => {
  const url = new URL(request.url);
  const match = url.pathname.match(resourcePathRegex);
  if (!match) {
    return null;
  }
  const resource = match[1] as ResourceKey;
  const id = match[2] ?? null;
  return { resource, id, url };
};

const clone = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
};

const generateId = (prefix: string) => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
};

const sanitizeDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : undefined;
  }
  return date.toISOString().slice(0, 10);
};

const normalizers: Partial<
  Record<ResourceKey, (data: Record<string, any>) => Record<string, any>>
> = {
  students: (data) => {
    const next = { ...data };
    const birthDate = sanitizeDate(next.birthDate);
    if (birthDate) next.birthDate = birthDate;
    return next;
  },
  classes: (data) => {
    const next = { ...data };
    if (typeof next.level === "string") {
      const parsed = Number(next.level);
      next.level = Number.isNaN(parsed) ? next.level : parsed;
    }
    return next;
  },
  subjects: (data) => ({ ...data }),
  teachers: (data) => ({ ...data }),
  terms: (data) => {
    const next = { ...data };
    const startDate = sanitizeDate(next.startDate);
    const endDate = sanitizeDate(next.endDate);
    if (startDate) next.startDate = startDate;
    if (endDate) next.endDate = endDate;
    if (typeof next.active !== "undefined") {
      next.active = Boolean(next.active);
    }
    return next;
  },
  "grade-components": (data) => {
    const next = { ...data };
    if (typeof next.weight === "string") {
      const parsed = Number(next.weight);
      next.weight = Number.isNaN(parsed) ? next.weight : parsed;
    }
    if (typeof next.kkm === "string") {
      const parsed = Number(next.kkm);
      next.kkm = Number.isNaN(parsed) ? next.kkm : parsed;
    }
    if (!next.classSubjectId && next.subjectId) {
      const mapping = classSubjects.find((item) => item.subjectId === next.subjectId);
      if (mapping) {
        next.classSubjectId = mapping.id;
      }
    }
    if (next.classSubjectId) {
      const mapping = classSubjects.find((item) => item.id === next.classSubjectId);
      if (mapping) {
        next.subjectId = mapping.subjectId;
        next.termId = mapping.termId;
      }
    }
    return next;
  },
  grades: (data) => {
    const next = { ...data };
    if (typeof next.score === "string") {
      const parsed = Number(next.score);
      next.score = Number.isNaN(parsed) ? next.score : parsed;
    }
    return next;
  },
  attendance: (data) => {
    const next = { ...data };
    const date = sanitizeDate(next.date);
    if (date) next.date = date;
    return next;
  },
  "grade-configs": (data) => {
    const next = { ...data };
    if (typeof next.kkm === "string") {
      const parsed = Number(next.kkm);
      next.kkm = Number.isNaN(parsed) ? next.kkm : parsed;
    }
    if (!next.status) {
      next.status = "draft";
    }
    return next;
  },
  "class-subjects": (data) => {
    const next = { ...data };
    if (typeof next.termId !== "string" || !next.termId) {
      next.termId = terms.find((term) => term.active)?.id ?? terms[0]?.id;
    }
    return next;
  },
  schedules: (data) => {
    const next = { ...data };
    if (typeof next.dayOfWeek === "string") {
      const parsed = Number(next.dayOfWeek);
      next.dayOfWeek = Number.isNaN(parsed) ? next.dayOfWeek : parsed;
    }
    if (Array.isArray(next.dayOfWeek)) {
      next.dayOfWeek = Number(next.dayOfWeek[0]);
    }
    if (typeof next.startTime === "string") {
      next.startTime = next.startTime.slice(0, 5);
    }
    if (typeof next.endTime === "string") {
      next.endTime = next.endTime.slice(0, 5);
    }
    return next;
  },
  announcements: (data) => ({ ...data }),
  "behavior-notes": (data) => {
    const next = { ...data };
    const date = sanitizeDate(next.date);
    if (date) next.date = date;
    return next;
  },
  mutations: (data) => {
    const next = { ...data };
    const effectiveDate = sanitizeDate(next.effectiveDate);
    if (effectiveDate) next.effectiveDate = effectiveDate;
    if (Array.isArray(next.auditTrail)) {
      next.auditTrail = next.auditTrail.map((entry: Record<string, any>) => ({
        ...entry,
        timestamp: entry.timestamp ?? new Date().toISOString(),
      }));
    }
    return next;
  },
  archives: (data) => {
    const next = { ...data };
    if (typeof next.fileSize === "string") {
      const parsed = Number(next.fileSize);
      next.fileSize = Number.isNaN(parsed) ? next.fileSize : parsed;
    }
    return next;
  },
  dashboard: (data) => ({ ...data }),
};

const sanitizePayload = (resource: ResourceKey, payload: Record<string, any>) => {
  const normalizer = normalizers[resource];
  return normalizer ? normalizer(payload) : { ...payload };
};

const collectIds = (url: URL) => {
  const ids: string[] = [];
  url.searchParams.forEach((value, key) => {
    if (key === "ids" || key === "ids[]" || key.startsWith("ids[")) {
      ids.push(value);
    }
  });
  return ids;
};

const getValue = (record: Record<string, any>, path: string) => {
  return path
    .split(".")
    .reduce<any>((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), record);
};

const parseFilters = (url: URL) => {
  const ignored = new Set([
    "filter",
    "_page",
    "_perPage",
    "page",
    "perPage",
    "_start",
    "_end",
    "_sort",
    "_order",
    "sort",
    "order",
    "ids",
    "ids[]",
    "limit",
    "cursor",
    "skip",
    "take",
    "offset",
    "current",
    "pageSize",
  ]);

  const filters: Record<string, unknown> = {};
  const filterParam = url.searchParams.get("filter");
  if (filterParam) {
    try {
      const parsed = JSON.parse(filterParam);
      if (parsed && typeof parsed === "object") {
        Object.assign(filters, parsed as Record<string, unknown>);
      }
    } catch {
      // ignore invalid JSON
    }
  }

  url.searchParams.forEach((value, key) => {
    if (ignored.has(key) || key.startsWith("ids[")) return;
    if (value === null || value === "") return;
    if (typeof filters[key] === "undefined") {
      filters[key] = value;
    }
  });

  return filters;
};

const applyFilters = (records: Record<string, any>[], filters: Record<string, unknown>) => {
  const entries = Object.entries(filters ?? {}).filter(
    ([, expected]) => expected !== undefined && expected !== null && expected !== ""
  );
  if (entries.length === 0) {
    return records;
  }

  return records.filter((record) =>
    entries.every(([rawKey, expected]) => {
      const isFuzzy = rawKey.endsWith("~");
      const key = isFuzzy ? rawKey.slice(0, -1) : rawKey;
      const actual = getValue(record, key);

      if (expected === undefined || expected === null) return true;
      if (Array.isArray(expected)) {
        return expected.includes(actual);
      }

      if (typeof expected === "string") {
        const normalizedExpected = expected.trim().toLowerCase();
        if (normalizedExpected === "") return true;
        const normalizedActual = String(actual ?? "")
          .trim()
          .toLowerCase();
        return isFuzzy || normalizedExpected.length > 2
          ? normalizedActual.includes(normalizedExpected)
          : normalizedActual === normalizedExpected;
      }

      return String(actual ?? "") === String(expected);
    })
  );
};

const applySort = (records: Record<string, any>[], sortField: string | null, sortOrder: string) => {
  if (!sortField) return records;
  const direction = sortOrder === "DESC" ? -1 : 1;

  return [...records].sort((a, b) => {
    const valueA = getValue(a, sortField);
    const valueB = getValue(b, sortField);
    if (valueA === valueB) return 0;
    if (valueA === undefined || valueA === null) return 1;
    if (valueB === undefined || valueB === null) return -1;

    if (typeof valueA === "number" && typeof valueB === "number") {
      return valueA < valueB ? -1 * direction : direction;
    }

    const stringA = String(valueA).toLowerCase();
    const stringB = String(valueB).toLowerCase();
    if (stringA === stringB) return 0;
    return stringA < stringB ? -1 * direction : direction;
  });
};

const applyPagination = (records: Record<string, any>[], url: URL) => {
  const total = records.length;
  const startParam = url.searchParams.get("_start");
  const endParam = url.searchParams.get("_end");

  if (startParam !== null && endParam !== null) {
    const start = Number(startParam);
    const end = Number(endParam);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      return { data: records.slice(start, end), total };
    }
  }

  const pageParam = url.searchParams.get("_page") ?? url.searchParams.get("page");
  const perPageParam = url.searchParams.get("_perPage") ?? url.searchParams.get("perPage");
  const page = Number(pageParam ?? 1);
  const perPage = Number(perPageParam ?? total);

  if (Number.isNaN(page) || Number.isNaN(perPage) || perPage <= 0) {
    return { data: records, total };
  }

  const startIndex = Math.max(0, (page - 1) * perPage);
  const endIndex = startIndex + perPage;
  return { data: records.slice(startIndex, endIndex), total };
};

const buildListResponse = (resource: ResourceKey, url: URL) => {
  const ids = collectIds(url);
  let items = stores[resource];
  if (ids.length > 0) {
    const idSet = new Set(ids.map(String));
    items = items.filter((item) => idSet.has(String(item.id)));
  }

  const filters = parseFilters(url);
  const sortField = url.searchParams.get("_sort") ?? url.searchParams.get("sort");
  const sortOrder = (url.searchParams.get("_order") ?? url.searchParams.get("order") ?? "ASC")
    .toString()
    .toUpperCase();

  let result = clone(items) as Record<string, any>[];
  result = applyFilters(result, filters);
  result = applySort(result, sortField, sortOrder);

  const limitParam = url.searchParams.get("limit");
  if (limitParam) {
    const limit = Number(limitParam);
    if (!Number.isNaN(limit) && limit > 0) {
      return { data: result.slice(0, limit), total: result.length };
    }
  }

  const paginated = applyPagination(result, url);

  return { data: paginated.data, total: paginated.total };
};

const findRecord = (resource: ResourceKey, id: string | null) => {
  if (!id) return null;
  return stores[resource].find((item) => String(item.id) === String(id)) ?? null;
};

const createRecord = (resource: ResourceKey, body: Record<string, any>) => {
  const payload = sanitizePayload(resource, { id: body.id ?? generateId(resource), ...body });
  stores[resource].unshift(payload);
  return clone(payload);
};

const updateRecord = (resource: ResourceKey, id: string, body: Record<string, any>) => {
  const store = stores[resource];
  const index = store.findIndex((item) => String(item.id) === String(id));
  if (index === -1) {
    return null;
  }
  const merged = { ...store[index], ...body, id: store[index].id };
  const payload = sanitizePayload(resource, merged);
  store[index] = payload;
  return clone(payload);
};

const deleteRecord = (resource: ResourceKey, id: string) => {
  const store = stores[resource];
  const index = store.findIndex((item) => String(item.id) === String(id));
  if (index === -1) {
    return null;
  }
  const [removed] = store.splice(index, 1);
  return clone(removed);
};

// Expose minimal helpers so tests can reuse the same in-memory fixtures.
export const mswTestUtils = {
  list(resource: ResourceKey) {
    return clone(stores[resource]);
  },
  create(resource: ResourceKey, body: Record<string, any>) {
    return createRecord(resource, body ?? {});
  },
  remove(resource: ResourceKey, id: string) {
    return deleteRecord(resource, id);
  },
  listUsers() {
    return mockUsers.map((user) => sanitizeUser(user));
  },
  getCurrentUser() {
    return clone(currentUser);
  },
  setCurrentUser(selector: { email?: string; role?: string }) {
    const candidate =
      findUserByEmail(selector?.email ?? undefined) ?? findUserByRole(selector?.role ?? undefined);

    if (!candidate) {
      throw new Error(
        `[MSW] Unable to locate mock user for selector ${JSON.stringify(selector ?? {})}`
      );
    }

    currentUser = sanitizeUser(candidate);
    return clone(currentUser);
  },
  getDashboard() {
    return clone(principalDashboard);
  },
  setDashboard(
    updater:
      | Partial<typeof principalDashboard>
      | ((current: typeof principalDashboard) => Partial<typeof principalDashboard>)
  ) {
    const next =
      typeof updater === "function"
        ? { ...principalDashboard, ...(updater(clone(principalDashboard)) ?? {}) }
        : { ...principalDashboard, ...(updater ?? {}) };
    Object.assign(principalDashboard, next);
    return clone(principalDashboard);
  },
};

// Simulation flags (toggle via query param or by editing these vars during dev)
let simulateRefreshFailure = false;
let simulateSessionExpiry = false;

export function setSimulation({
  refreshFailure,
  sessionExpiry,
}: {
  refreshFailure?: boolean;
  sessionExpiry?: boolean;
}) {
  if (typeof refreshFailure === "boolean") simulateRefreshFailure = refreshFailure;
  if (typeof sessionExpiry === "boolean") simulateSessionExpiry = sessionExpiry;
}

export async function createHandlers() {
  const authLoginRegex = /\/(?:api(?:\/v1)?)?\/auth\/login$/;
  const authMeRegex = /\/(?:api(?:\/v1)?)?\/auth\/me$/;
  const authLogoutRegex = /\/(?:api(?:\/v1)?)?\/auth\/logout$/;
  const authRefreshRegex = /\/(?:api(?:\/v1)?)?\/auth\/refresh$/;

  return [
    http.post(authLoginRegex, async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as {
        email?: string;
        password?: string;
      };
      const { email, password } = body || {};
      const candidate = findUserByEmail(email ?? null);
      const isPasswordValid =
        candidate && (candidate.password === undefined || candidate.password === password);

      if (!candidate || !isPasswordValid) {
        return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
      }

      const sanitized = sanitizeUser(candidate);
      currentUser = sanitized;

      const payload = {
        accessToken: `mock-access-token-${candidate.id}`,
        refreshToken: `mock-refresh-token-${candidate.id}`,
        access_token: `mock-access-token-${candidate.id}`,
        refresh_token: `mock-refresh-token-${candidate.id}`,
        expiresIn: 3600,
        refreshExpiresIn: 86400,
        tokenType: "Bearer",
        user: sanitized,
      };

      return HttpResponse.json(
        {
          ...payload,
          data: payload,
          result: payload,
        },
        { status: 200 }
      );
    }),

    http.get(authMeRegex, ({ request }) => {
      const auth = request.headers.get("authorization");
      if (!auth?.startsWith("Bearer mock-access-token")) {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      return HttpResponse.json(currentUser, { status: 200 });
    }),

    http.post(authLogoutRegex, () => {
      currentUser = sanitizeUser(mockUsers[0]);
      return HttpResponse.json({ success: true }, { status: 200 });
    }),

    http.post(authRefreshRegex, async ({ request }) => {
      const url = new URL(request.url);
      if (simulateRefreshFailure || url.searchParams.get("fail") === "1") {
        return HttpResponse.json({ message: "Refresh token expired" }, { status: 401 });
      }

      if (simulateSessionExpiry || url.searchParams.get("expire") === "1") {
        return HttpResponse.json({ message: "Session expired" }, { status: 403 });
      }

      return HttpResponse.json(
        { accessToken: "mock-access-token", refreshToken: "mock-refresh-token" },
        { status: 200 }
      );
    }),

    http.get(/\/api(?:\/v1)?\/dashboard\/academics$/, () =>
      HttpResponse.json(principalDashboard, { status: 200 })
    ),

    http.get(resourcePathRegex, ({ request }) => {
      const parsed = parseResourceRequest(request);
      if (!parsed) {
        return HttpResponse.json({ message: "Not mocked in MSW" }, { status: 404 });
      }
      const { resource, id, url } = parsed;
      if (id) {
        const record = findRecord(resource, id);
        if (!record) {
          return HttpResponse.json({ message: "Not found" }, { status: 404 });
        }
        return HttpResponse.json(record, { status: 200 });
      }
      const payload = buildListResponse(resource, url);
      return HttpResponse.json(payload, { status: 200 });
    }),

    http.post(resourcePathRegex, async ({ request }) => {
      const parsed = parseResourceRequest(request);
      if (!parsed || parsed.id) {
        return HttpResponse.json({ message: "Not mocked in MSW" }, { status: 404 });
      }
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const created = createRecord(parsed.resource, body ?? {});
      return HttpResponse.json(created, { status: 201 });
    }),

    http.patch(resourcePathRegex, async ({ request }) => {
      const parsed = parseResourceRequest(request);
      if (!parsed || !parsed.id) {
        return HttpResponse.json({ message: "Not mocked in MSW" }, { status: 404 });
      }
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const updated = updateRecord(parsed.resource, parsed.id, body ?? {});
      if (!updated) {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      }
      return HttpResponse.json(updated, { status: 200 });
    }),

    http.delete(resourcePathRegex, ({ request }) => {
      const parsed = parseResourceRequest(request);
      if (!parsed || !parsed.id) {
        return HttpResponse.json({ message: "Not mocked in MSW" }, { status: 404 });
      }
      const removed = deleteRecord(parsed.resource, parsed.id);
      if (!removed) {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      }
      return HttpResponse.json(removed, { status: 200 });
    }),

    http.all(/\/api(?:\/v1)?\/.*$/, () =>
      HttpResponse.json({ message: "Not mocked in MSW" }, { status: 404 })
    ),
  ];
}

const defaultHandlers = await createHandlers();

export default defaultHandlers;
