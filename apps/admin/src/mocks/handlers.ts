import { http, HttpResponse } from "msw";

/**
 * Scenario: SMA Negeri Harapan Nusantara (Tahun Pelajaran 2024/2025)
 *
 * Struktur semester dan penjadwalan mengikuti kalender pendidikan provinsi
 * (contoh: Kalender Pendidikan DKI Jakarta 2024/2025) dan implementasi Kurikulum
 * Merdeka sesuai Permendikbudristek No. 56/M/2022. Data guru menggunakan format
 * NIP 18 digit, kelas level 10-12 (X, XI, XII), serta komponen nilai berbobot 100%.
 */

let currentUser = {
  id: "user_superadmin",
  email: "superadmin@harapannusantara.sch.id",
  fullName: "Super Admin",
  role: "SUPERADMIN",
};

const students = [
  {
    id: "stu_aditya_wijaya",
    nis: "2024-010",
    fullName: "Aditya Wijaya",
    birthDate: "2008-11-20",
    gender: "M",
    guardian: "Bambang Wijaya",
    guardianPhone: "081234567890",
  },
  {
    id: "stu_sri_rahayu",
    nis: "2024-011",
    fullName: "Sri Rahayu",
    birthDate: "2009-03-12",
    gender: "F",
    guardian: "Sulastri",
    guardianPhone: "081345678901",
  },
  {
    id: "stu_nabila_pratiwi",
    nis: "2024-012",
    fullName: "Nabila Pratiwi",
    birthDate: "2008-08-04",
    gender: "F",
    guardian: "Hendra Pratama",
    guardianPhone: "081356789012",
  },
  {
    id: "stu_raffael_putra",
    nis: "2024-013",
    fullName: "Raffael Putra",
    birthDate: "2009-02-01",
    gender: "M",
    guardian: "Yuliana Putri",
    guardianPhone: "081367890123",
  },
];

const teachers = [
  {
    id: "tch_marta_siregar",
    fullName: "Ibu Marta Siregar",
    nip: "19781212 200501 2 001",
    email: "marta.siregar@harapannusantara.sch.id",
    phone: "081234567890",
  },
  {
    id: "tch_budi_hartono",
    fullName: "Pak Budi Hartono",
    nip: "19790524 200701 1 002",
    email: "budi.hartono@harapannusantara.sch.id",
    phone: "081245678901",
  },
  {
    id: "tch_dewi_lestari",
    fullName: "Ibu Dewi Lestari",
    nip: "19830615 200902 2 003",
    email: "dewi.lestari@harapannusantara.sch.id",
    phone: "081256789012",
  },
  {
    id: "tch_fajar_rahman",
    fullName: "Pak Fajar Rahman",
    nip: "19850808 201003 1 004",
    email: "fajar.rahman@harapannusantara.sch.id",
    phone: "081267890123",
  },
];

const classes = [
  {
    id: "class_x_ipa_1",
    name: "Kelas X IPA 1",
    level: 10,
    homeroomId: "tch_marta_siregar",
    termId: "term_2024_ganjil",
  },
  {
    id: "class_xi_ips_1",
    name: "Kelas XI IPS 1",
    level: 11,
    homeroomId: "tch_budi_hartono",
    termId: "term_2024_ganjil",
  },
  {
    id: "class_xii_ipa_1",
    name: "Kelas XII IPA 1",
    level: 12,
    homeroomId: "tch_dewi_lestari",
    termId: "term_2024_ganjil",
  },
];

const subjects = [
  { id: "sub_mat_xa", code: "MAT-XA", name: "Matematika Wajib" },
  { id: "sub_bin_xa", code: "BIN-XA", name: "Bahasa Indonesia" },
  { id: "sub_fis_xa", code: "FIS-XA", name: "Fisika" },
  { id: "sub_sos_xi", code: "SOS-XI", name: "Sosiologi" },
];

const terms = [
  {
    id: "term_2024_ganjil",
    name: "TP 2024/2025 - Semester Ganjil",
    startDate: "2024-07-15",
    endDate: "2024-12-21",
    active: true,
  },
  {
    id: "term_2024_genap",
    name: "TP 2024/2025 - Semester Genap",
    startDate: "2025-01-06",
    endDate: "2025-06-21",
    active: false,
  },
];

const enrollments = [
  {
    id: "enr_aditya_xipa",
    studentId: "stu_aditya_wijaya",
    classId: "class_x_ipa_1",
    termId: "term_2024_ganjil",
  },
  {
    id: "enr_sri_xipa",
    studentId: "stu_sri_rahayu",
    classId: "class_x_ipa_1",
    termId: "term_2024_ganjil",
  },
  {
    id: "enr_nabila_xiips",
    studentId: "stu_nabila_pratiwi",
    classId: "class_xi_ips_1",
    termId: "term_2024_ganjil",
  },
  {
    id: "enr_raffael_xiips",
    studentId: "stu_raffael_putra",
    classId: "class_xi_ips_1",
    termId: "term_2024_ganjil",
  },
];

const gradeComponents = [
  {
    id: "gc_mat_mid",
    name: "Penilaian Tengah Semester",
    weight: 40,
    classSubjectId: "cs_xipa_mat",
    kkm: 70,
    description: "Ujian tengah semester matematika",
  },
  {
    id: "gc_mat_final",
    name: "Penilaian Akhir Semester",
    weight: 60,
    classSubjectId: "cs_xipa_mat",
    kkm: 70,
    description: "Ujian akhir semester matematika",
  },
  {
    id: "gc_sos_project",
    name: "Projek Sosial",
    weight: 50,
    classSubjectId: "cs_xiips_sos",
    kkm: 75,
    description: "Projek kolaboratif",
  },
  {
    id: "gc_sos_exam",
    name: "Penilaian Akhir Semester",
    weight: 50,
    classSubjectId: "cs_xiips_sos",
    kkm: 75,
    description: "Evaluasi akhir semester",
  },
];

const gradeConfigs = [
  {
    id: "gcfg_cs_xipa_mat",
    classSubjectId: "cs_xipa_mat",
    scheme: "WEIGHTED",
    kkm: 70,
    status: "draft",
  },
  {
    id: "gcfg_cs_xiips_sos",
    classSubjectId: "cs_xiips_sos",
    scheme: "AVERAGE",
    kkm: 75,
    status: "finalized",
  },
];

const grades = [
  {
    id: "grade_aditya_mid_mat",
    enrollmentId: "enr_aditya_xipa",
    subjectId: "sub_mat_xa",
    componentId: "gc_mat_mid",
    score: 82,
    teacherId: "tch_marta_siregar",
  },
  {
    id: "grade_aditya_final_mat",
    enrollmentId: "enr_aditya_xipa",
    subjectId: "sub_mat_xa",
    componentId: "gc_mat_final",
    score: 88,
    teacherId: "tch_marta_siregar",
  },
  {
    id: "grade_sri_mid_mat",
    enrollmentId: "enr_sri_xipa",
    subjectId: "sub_mat_xa",
    componentId: "gc_mat_mid",
    score: 90,
    teacherId: "tch_marta_siregar",
  },
  {
    id: "grade_sri_final_mat",
    enrollmentId: "enr_sri_xipa",
    subjectId: "sub_mat_xa",
    componentId: "gc_mat_final",
    score: 92,
    teacherId: "tch_marta_siregar",
  },
  {
    id: "grade_nabila_project_sos",
    enrollmentId: "enr_nabila_xiips",
    subjectId: "sub_sos_xi",
    componentId: "gc_sos_project",
    score: 87,
    teacherId: "tch_dewi_lestari",
  },
  {
    id: "grade_nabila_exam_sos",
    enrollmentId: "enr_nabila_xiips",
    subjectId: "sub_sos_xi",
    componentId: "gc_sos_exam",
    score: 81,
    teacherId: "tch_dewi_lestari",
  },
];

const attendance = [
  {
    id: "att_aditya_2024-08-05",
    enrollmentId: "enr_aditya_xipa",
    date: "2024-08-05",
    sessionType: "Harian",
    status: "H",
    subjectId: "sub_mat_xa",
    teacherId: "tch_marta_siregar",
  },
  {
    id: "att_sri_2024-08-05",
    enrollmentId: "enr_sri_xipa",
    date: "2024-08-05",
    sessionType: "Harian",
    status: "I",
    subjectId: "sub_mat_xa",
    teacherId: "tch_marta_siregar",
  },
  {
    id: "att_nabila_2024-08-12",
    enrollmentId: "enr_nabila_xiips",
    date: "2024-08-12",
    sessionType: "Mapel",
    status: "H",
    subjectId: "sub_sos_xi",
    teacherId: "tch_dewi_lestari",
  },
];

const classSubjects = [
  {
    id: "cs_xipa_mat",
    classroomId: "class_x_ipa_1",
    subjectId: "sub_mat_xa",
    teacherId: "tch_marta_siregar",
    termId: "term_2024_ganjil",
  },
  {
    id: "cs_xipa_bin",
    classroomId: "class_x_ipa_1",
    subjectId: "sub_bin_xa",
    teacherId: "tch_budi_hartono",
    termId: "term_2024_ganjil",
  },
  {
    id: "cs_xiips_sos",
    classroomId: "class_xi_ips_1",
    subjectId: "sub_sos_xi",
    teacherId: "tch_dewi_lestari",
    termId: "term_2024_ganjil",
  },
];

const schedules = [
  {
    id: "sch_xipa_mat_mon",
    classSubjectId: "cs_xipa_mat",
    dayOfWeek: 1,
    startTime: "07:30",
    endTime: "09:00",
    room: "Ruang 101",
  },
  {
    id: "sch_xipa_bin_mon",
    classSubjectId: "cs_xipa_bin",
    dayOfWeek: 1,
    startTime: "09:15",
    endTime: "10:45",
    room: "Ruang 101",
  },
  {
    id: "sch_xiips_sos_tue",
    classSubjectId: "cs_xiips_sos",
    dayOfWeek: 2,
    startTime: "08:00",
    endTime: "09:30",
    room: "Ruang 203",
  },
];

const announcements = [
  {
    id: "ann_general",
    title: "Pembagian Rapor Semester",
    body: "Pembagian rapor dilaksanakan Jumat, 20 Desember 2024 pukul 08:00 di aula sekolah.",
    audience: "ALL",
    publishAt: "2024-12-15T08:00:00.000Z",
    publishedAt: "2024-12-15T08:05:00.000Z",
    authorId: "user_superadmin",
  },
  {
    id: "ann_teachers",
    title: "Workshop Kurikulum Merdeka",
    body: "Seluruh guru diundang mengikuti workshop pada 5 Januari 2025.",
    audience: "TEACHERS",
    publishAt: "2024-12-18T09:00:00.000Z",
    publishedAt: "2024-12-18T09:10:00.000Z",
    authorId: "user_superadmin",
  },
  {
    id: "ann_students",
    title: "Lomba Sains",
    body: "Pendaftaran lomba sains dibuka hingga 10 Januari 2025.",
    audience: "STUDENTS",
    publishAt: "2024-12-10T07:30:00.000Z",
    publishedAt: "2024-12-10T07:35:00.000Z",
    authorId: "user_superadmin",
  },
];

const behaviorNotes = [
  {
    id: "bn_aditya_1",
    studentId: "stu_aditya_wijaya",
    classroomId: "class_x_ipa_1",
    createdById: "user_superadmin",
    date: "2024-08-20",
    category: "Kedisiplinan",
    note: "Terlambat masuk kelas sebanyak 2 kali minggu ini.",
  },
  {
    id: "bn_sri_1",
    studentId: "stu_sri_rahayu",
    classroomId: "class_x_ipa_1",
    createdById: "user_superadmin",
    date: "2024-08-22",
    category: "Prestasi",
    note: "Menjadi juara lomba debat antar kelas.",
  },
  {
    id: "bn_nabila_1",
    studentId: "stu_nabila_pratiwi",
    classroomId: "class_xi_ips_1",
    createdById: "user_superadmin",
    date: "2024-08-18",
    category: "Kedisiplinan",
    note: "Perlu bimbingan terkait pengerjaan tugas tepat waktu.",
  },
];

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
] as const;

type ResourceKey = (typeof resourceKeys)[number];

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
};

const resourcePathRegex =
  /\/api(?:\/v1)?\/(students|teachers|classes|subjects|terms|enrollments|grade-components|grade-configs|grades|attendance|class-subjects|schedules|announcements|behavior-notes)(?:\/([^/?]+))?\/?$/;

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

const buildListResponse = (resource: ResourceKey, url: URL) => {
  const ids = collectIds(url);
  let items = stores[resource];
  if (ids.length > 0) {
    const idSet = new Set(ids.map(String));
    items = items.filter((item) => idSet.has(String(item.id)));
  }

  let result = clone(items);

  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  if (limit && !Number.isNaN(limit)) {
    result = result.slice(0, limit);
  }

  return { data: result, total: items.length };
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
  const authLoginRegex = /\/api(?:\/v1)?\/auth\/login$/;
  const authMeRegex = /\/api(?:\/v1)?\/auth\/me$/;
  const authLogoutRegex = /\/api(?:\/v1)?\/auth\/logout$/;
  const authRefreshRegex = /\/api(?:\/v1)?\/auth\/refresh$/;

  return [
    http.post(authLoginRegex, async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as {
        email?: string;
        password?: string;
      };
      const { email, password } = body || {};

      if (email === "superadmin@example.sch.id" && password === "Admin123!") {
        const payload = {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expiresIn: 3600,
          refreshExpiresIn: 86400,
          tokenType: "Bearer",
          user: currentUser,
        };

        return HttpResponse.json(
          {
            ...payload,
            data: payload,
            result: payload,
          },
          { status: 200 }
        );
      }

      return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }),

    http.get(authMeRegex, ({ request }) => {
      const auth = request.headers.get("authorization");
      if (!auth?.startsWith("Bearer mock-access-token")) {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      return HttpResponse.json(currentUser, { status: 200 });
    }),

    http.post(authLogoutRegex, () => HttpResponse.json({ success: true }, { status: 200 })),

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
