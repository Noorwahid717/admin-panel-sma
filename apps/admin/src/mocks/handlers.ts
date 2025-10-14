import { rest } from "msw";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

// Minimal in-memory fixtures
let currentUser = {
  id: "user_superadmin",
  email: "superadmin@example.sch.id",
  fullName: "Super Admin",
  role: "SUPERADMIN",
};

const students = [
  { id: "stu_1", fullName: "Ani Putri", studentId: "S001", birthDate: "2010-05-12", classId: null },
  {
    id: "stu_2",
    fullName: "Budi Santoso",
    studentId: "S002",
    birthDate: "2010-08-30",
    classId: null,
  },
];

const teachers = [
  { id: "tch_1", fullName: "Ibu Siti", teacherId: "T01", email: "siti@example.sch.id" },
  { id: "tch_2", fullName: "Pak Joko", teacherId: "T02", email: "joko@example.sch.id" },
];

const classes = [
  { id: "class_1", name: "Kelas 1A", teacherId: "tch_1" },
  { id: "class_2", name: "Kelas 2B", teacherId: "tch_2" },
];

const subjects = [
  { id: "sub_1", name: "Matematika" },
  { id: "sub_2", name: "Bahasa Indonesia" },
];

const terms = [
  { id: "term_1", name: "Semester 1", startDate: "2025-07-01", endDate: "2025-12-15" },
  { id: "term_2", name: "Semester 2", startDate: "2026-01-05", endDate: "2026-06-20" },
];

const enrollments = [{ id: "enr_1", studentId: "stu_1", classId: "class_1", termId: "term_1" }];

const gradeComponents = [
  { id: "gc_1", name: "UTS", weight: 40 },
  { id: "gc_2", name: "UAS", weight: 60 },
];

const grades = [{ id: "g_1", studentId: "stu_1", subjectId: "sub_1", value: 85 }];

const attendance = [{ id: "att_1", studentId: "stu_1", date: "2025-09-01", status: "present" }];

const makeList = (resource: string) => {
  switch (resource) {
    case "students":
      return { data: students, total: students.length };
    case "teachers":
      return { data: teachers, total: teachers.length };
    case "classes":
      return { data: classes, total: classes.length };
    case "subjects":
      return { data: subjects, total: subjects.length };
    case "terms":
      return { data: terms, total: terms.length };
    case "enrollments":
      return { data: enrollments, total: enrollments.length };
    case "grade-components":
      return { data: gradeComponents, total: gradeComponents.length };
    case "grades":
      return { data: grades, total: grades.length };
    case "attendance":
      return { data: attendance, total: attendance.length };
    default:
      return { data: [], total: 0 };
  }
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
  // Use the top-level `rest` import from msw. Avoid dynamic deep imports
  // which may be blocked by Vite/package export maps. This keeps handler
  // definitions deterministic at runtime.
  const authLoginRegex = /\/api(?:\/v1)?\/auth\/login$/;
  const authMeRegex = /\/api(?:\/v1)?\/auth\/me$/;
  const authLogoutRegex = /\/api(?:\/v1)?\/auth\/logout$/;
  const authRefreshRegex = /\/api(?:\/v1)?\/auth\/refresh$/;
  const listRegex =
    /\/api(?:\/v1)?\/(students|teachers|classes|subjects|terms|enrollments|grade-components|grades|attendance)(?:\/|$)/;

  return [
    // Auth: login
    rest.post(authLoginRegex, async (req: any, res: any, ctx: any) => {
      const body = await req.json();
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

        return res(
          ctx.status(200),
          ctx.json({
            ...payload,
            data: payload,
            result: payload,
          })
        );
      }

      return res(ctx.status(401), ctx.json({ message: "Invalid email or password" }));
    }),

    // Auth: me
    rest.get(new RegExp(authMeRegex), (req: any, res: any, ctx: any) => {
      const auth = req.headers.get("authorization");
      if (!auth?.startsWith("Bearer mock-access-token")) {
        return res(ctx.status(401), ctx.json({ message: "Unauthorized" }));
      }
      return res(ctx.status(200), ctx.json(currentUser));
    }),

    // Auth: logout
    rest.post(new RegExp(authLogoutRegex), async (req: any, res: any, ctx: any) => {
      return res(ctx.status(200), ctx.json({ success: true }));
    }),

    // Auth: token refresh
    rest.post(new RegExp(authRefreshRegex), async (req: any, res: any, ctx: any) => {
      // If simulateRefreshFailure is enabled, return 401 to simulate expired/invalid refresh token
      if (simulateRefreshFailure || req.url.searchParams.get("fail") === "1") {
        return res(ctx.status(401), ctx.json({ message: "Refresh token expired" }));
      }

      if (simulateSessionExpiry || req.url.searchParams.get("expire") === "1") {
        // Simulate that session expiry causes refresh to return 403
        return res(ctx.status(403), ctx.json({ message: "Session expired" }));
      }

      return res(
        ctx.status(200),
        ctx.json({ accessToken: "mock-access-token", refreshToken: "mock-refresh-token" })
      );
    }),

    // Generic list endpoints used by the admin UI
    rest.get(new RegExp(listRegex), (req: any, res: any, ctx: any) => {
      const match = req.url.pathname.match(
        /\/(students|teachers|classes|subjects|terms|enrollments|grade-components|grades|attendance)(?:\/|$)/
      );
      const resource = match ? match[1] : "unknown";
      return res(ctx.status(200), ctx.json(makeList(resource)));
    }),

    // Fallback: return 404 for other API requests in dev
    rest.all(/\/api(?:\/v1)?\/.*$/, (req: any, res: any, ctx: any) => {
      return res(ctx.status(404), ctx.json({ message: "Not mocked in MSW" }));
    }),
  ];
}
