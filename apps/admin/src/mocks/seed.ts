/* eslint-disable @typescript-eslint/no-use-before-define */
type Track = "IPA" | "IPS";

type TermRecord = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  year: string;
  semester: 1 | 2;
};

type SubjectRecord = {
  id: string;
  code: string;
  name: string;
  group: "CORE" | "DIFFERENTIATED" | "ELECTIVE";
  tracks: Array<Track | "ALL">;
};

type TeacherRecord = {
  id: string;
  fullName: string;
  nip: string;
  email: string;
  phone: string;
  mainSubjectId: string;
  active: boolean;
};

type ClassRecord = {
  id: string;
  code: string;
  name: string;
  level: number;
  track: Track;
  homeroomId: string;
  termId: string;
};

type StudentRecord = {
  id: string;
  nis: string;
  fullName: string;
  gender: "M" | "F";
  birthDate: string;
  guardian: string;
  guardianPhone: string;
  guardianEmail: string;
  classId: string;
  status: "active" | "inactive";
};

type EnrollmentRecord = {
  id: string;
  studentId: string;
  classId: string;
  termId: string;
};

type ClassSubjectRecord = {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  termId: string;
};

type ScheduleRecord = {
  id: string;
  classSubjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  slot: number;
};

export type TeacherPreferenceRecord = {
  id: string;
  teacherId: string;
  preferredDays: number[];
  blockedDays: number[];
  preferredSlots: number[];
  maxDailySessions: number;
  availabilityLevel: "HIGH" | "MEDIUM" | "LOW";
  notes: string;
};

export type SemesterScheduleSlotRecord = {
  id: string;
  classId: string;
  dayOfWeek: number;
  slot: number;
  teacherId: string | null;
  subjectId: string | null;
  status: "EMPTY" | "PREFERENCE" | "COMPROMISE" | "CONFLICT";
  locked?: boolean;
};

type GradeComponentRecord = {
  id: string;
  name: string;
  weight: number;
  classSubjectId: string;
  kkm: number;
  description: string;
};

type GradeConfigRecord = {
  id: string;
  classSubjectId: string;
  scheme: "WEIGHTED" | "AVERAGE";
  kkm: number;
  status: "draft" | "finalized";
};

type GradeRecord = {
  id: string;
  enrollmentId: string;
  subjectId: string;
  componentId: string;
  score: number;
  teacherId: string;
};

type AttendanceRecord = {
  id: string;
  enrollmentId: string;
  classId: string;
  date: string;
  status: "H" | "S" | "I" | "A";
  sessionType: "Harian" | "Mapel";
  subjectId?: string;
  teacherId?: string;
  note?: string;
  slot?: number;
  recordedAt?: string;
  updatedAt?: string;
};

type CalendarCategory =
  | "EFFECTIVE_DAY"
  | "HOLIDAY"
  | "EXAM"
  | "SCHOOL_ACTIVITY"
  | "MEETING"
  | "EXTRACURRICULAR"
  | "INACTIVE_DAY";

type CalendarEventRecord = {
  id: string;
  title: string;
  description?: string;
  category: CalendarCategory;
  startDate: string;
  endDate: string;
  termId: string;
  organizer?: string;
  location?: string;
  createdById?: string;
  audience?: "ALL" | "GURU" | "SISWA" | "ORTU" | `CLASS:${string}`;
  relatedClassIds?: string[];
  tags?: string[];
  allDay?: boolean;
  source?: "MANUAL" | "SYNTHETIC" | "EXTERNAL";
};

type ExamEventRecord = {
  id: string;
  name: string;
  termId: string;
  examType: "PTS" | "PAS" | "TRYOUT" | "PRAKTEK";
  startDate: string;
  endDate: string;
  scope: "SCHOOL" | "GRADE" | "CLASS";
  relatedClassIds: string[];
  organizer: string;
  description?: string;
  publishedAt: string;
  tags?: string[];
};

type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  audience: "ALL" | "GURU" | "SISWA" | `CLASS:${string}`;
  publishAt: string;
  publishedAt: string;
  authorId: string;
  pinned?: boolean;
};

type BehaviorNoteRecord = {
  id: string;
  studentId: string;
  classroomId: string;
  createdById: string;
  date: string;
  category: "Kedisiplinan" | "Prestasi" | "Intervensi" | "Kesehatan";
  note: string;
};

type MutationRecord = {
  id: string;
  studentId: string;
  studentName: string;
  type: "IN" | "OUT" | "INTERNAL";
  effectiveDate: string;
  fromClassId: string | null;
  fromClassName: string | null;
  toClassId: string | null;
  toClassName: string | null;
  reason: string;
  handledById: string;
  handledByName: string;
  auditTrail: Array<{
    id: string;
    timestamp: string;
    actorId: string;
    actorName: string;
    action: string;
    details: string;
  }>;
};

type ArchiveRecord = {
  id: string;
  termId: string;
  termName: string;
  type: "REPORT_PDF" | "ATTENDANCE_CSV" | "GRADE_XLSX";
  label: string;
  format: "zip" | "csv" | "pdf" | "xlsx";
  fileName: string;
  fileSize: number;
  checksum: string;
  downloadUrl: string;
  generatedAt: string;
  generatedBy: string;
};

type DashboardRecord = {
  termId: string;
  updatedAt: string;
  distribution: {
    overallAverage: number;
    totalStudents: number;
    byRange: Array<{ range: string; count: number }>;
    byClass: Array<{
      classId: string;
      className: string;
      average: number;
      highest: number;
      lowest: number;
    }>;
  };
  outliers: Array<{
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    zScore: number;
    score: number;
    trend: "UP" | "DOWN";
    lastUpdated: string;
  }>;
  remedial: Array<{
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    score: number;
    kkm: number;
    attempts: number;
    lastAttempt: string;
  }>;
  attendance: {
    overall: number;
    byClass: Array<{ classId: string; className: string; percentage: number }>;
    alerts: Array<{
      classId: string;
      className: string;
      indicator: string;
      percentage: number;
      week: string;
    }>;
  };
};

export type SeedData = {
  terms: TermRecord[];
  subjects: SubjectRecord[];
  teachers: TeacherRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  enrollments: EnrollmentRecord[];
  classSubjects: ClassSubjectRecord[];
  schedules: ScheduleRecord[];
  teacherPreferences: TeacherPreferenceRecord[];
  semesterSchedule: SemesterScheduleSlotRecord[];
  gradeComponents: GradeComponentRecord[];
  gradeConfigs: GradeConfigRecord[];
  grades: GradeRecord[];
  attendance: AttendanceRecord[];
  calendarEvents: CalendarEventRecord[];
  examEvents: ExamEventRecord[];
  announcements: AnnouncementRecord[];
  behaviorNotes: BehaviorNoteRecord[];
  mutations: MutationRecord[];
  archives: ArchiveRecord[];
  dashboard: DashboardRecord;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const pad = (value: number, size: number) => value.toString().padStart(size, "0");

const checksum = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
};

const ATTENDANCE_DATES = [
  "2024-08-19",
  "2024-08-20",
  "2024-08-21",
  "2024-08-22",
  "2024-08-23",
  "2024-08-26",
  "2024-08-27",
  "2024-08-28",
  "2024-08-29",
  "2024-08-30",
];

const MAPEL_ATTENDANCE_DATES = ["2024-08-19", "2024-08-22", "2024-08-26", "2024-08-29"];

export function createSeedData(): SeedData {
  const terms = createTerms();
  const subjects = createSubjects();
  const teachers = createTeachers(subjects);
  const classes = createClasses(terms[0], teachers);
  const { classSubjects, classSubjectsByClass } = createClassSubjects(classes, subjects, teachers);
  const { students, studentsByClass } = createStudents(classes);
  const enrollments = createEnrollments(students, classes);
  const schedules = createSchedules(classSubjects);
  const { gradeComponents, gradeComponentMap } = createGradeComponents(classSubjects);
  const gradeConfigs = createGradeConfigs(classSubjects);
  const grades = createGrades(enrollments, classSubjects, gradeComponents, gradeComponentMap);
  const attendance = createAttendance(
    enrollments,
    classSubjects,
    schedules,
    studentsByClass,
    classSubjectsByClass,
    teachers
  );
  const teacherPreferences = createTeacherPreferences(teachers);
  const semesterSchedule = createSemesterSchedule(classes, classSubjects, teacherPreferences);
  const calendarEvents = createCalendarEvents(terms, classes, teachers);
  const examEvents = createExamEvents(terms, classes, subjects);
  const announcements = createAnnouncements(classes);
  const behaviorNotes = createBehaviorNotes(students, classes);
  const mutations = createMutations(students, classes, teachers);
  const archives = createArchives(terms[0], classes.length);
  const dashboard = createDashboard(
    terms[0],
    classes,
    enrollments,
    classSubjects,
    gradeComponents,
    grades,
    attendance,
    subjects,
    students
  );

  return {
    terms,
    subjects,
    teachers,
    classes,
    students,
    enrollments,
    classSubjects,
    schedules,
    teacherPreferences,
    semesterSchedule,
    gradeComponents,
    gradeConfigs,
    grades,
    attendance,
    calendarEvents,
    examEvents,
    announcements,
    behaviorNotes,
    mutations,
    archives,
    dashboard,
  };
}

function createTerms(): TermRecord[] {
  return [
    {
      id: "term_2024_ganjil",
      name: "TP 2024/2025 - Semester Ganjil",
      startDate: "2024-07-15",
      endDate: "2024-12-21",
      active: true,
      year: "2024/2025",
      semester: 1,
    },
    {
      id: "term_2024_genap",
      name: "TP 2024/2025 - Semester Genap",
      startDate: "2025-01-06",
      endDate: "2025-06-21",
      active: false,
      year: "2024/2025",
      semester: 2,
    },
  ];
}

function createSubjects(): SubjectRecord[] {
  const definitions: Array<SubjectRecord> = [
    { id: "", code: "BIN", name: "Bahasa Indonesia", group: "CORE", tracks: ["IPA", "IPS"] },
    { id: "", code: "ENG", name: "Bahasa Inggris", group: "CORE", tracks: ["IPA", "IPS"] },
    { id: "", code: "MAT", name: "Matematika Umum", group: "CORE", tracks: ["IPA", "IPS"] },
    {
      id: "",
      code: "MAT-P",
      name: "Matematika Peminatan",
      group: "DIFFERENTIATED",
      tracks: ["IPA"],
    },
    { id: "", code: "FIS", name: "Fisika", group: "DIFFERENTIATED", tracks: ["IPA"] },
    { id: "", code: "KIM", name: "Kimia", group: "DIFFERENTIATED", tracks: ["IPA"] },
    { id: "", code: "BIO", name: "Biologi", group: "DIFFERENTIATED", tracks: ["IPA"] },
    { id: "", code: "SEJ", name: "Sejarah Indonesia", group: "CORE", tracks: ["IPA", "IPS"] },
    { id: "", code: "SOS", name: "Sosiologi", group: "DIFFERENTIATED", tracks: ["IPS"] },
    { id: "", code: "EKO", name: "Ekonomi", group: "DIFFERENTIATED", tracks: ["IPS"] },
    { id: "", code: "GEO", name: "Geografi", group: "DIFFERENTIATED", tracks: ["IPS"] },
    { id: "", code: "PPKN", name: "PPKN", group: "CORE", tracks: ["IPA", "IPS"] },
    { id: "", code: "AGM", name: "Pendidikan Agama", group: "CORE", tracks: ["IPA", "IPS"] },
    { id: "", code: "PJOK", name: "Pendidikan Jasmani", group: "CORE", tracks: ["IPA", "IPS"] },
    { id: "", code: "SENI", name: "Seni Budaya", group: "ELECTIVE", tracks: ["IPA", "IPS"] },
    { id: "", code: "TIK", name: "Informatika", group: "ELECTIVE", tracks: ["IPA", "IPS"] },
  ];

  return definitions.map((subject) => ({
    ...subject,
    id: `sub_${slugify(subject.code)}`,
  }));
}

function createTeachers(subjects: SubjectRecord[]): TeacherRecord[] {
  const femaleNames = [
    "Marta",
    "Dewi",
    "Intan",
    "Ratna",
    "Latifah",
    "Sabrina",
    "Nadira",
    "Lestari",
    "Yunita",
    "Selina",
    "Olivia",
    "Putri",
    "Yohana",
    "Anindya",
    "Pratiwi",
    "Larissa",
  ];
  const maleNames = [
    "Budi",
    "Fajar",
    "Rahmat",
    "Surya",
    "Firman",
    "Yoga",
    "Taufik",
    "Andika",
    "Randi",
    "Ilham",
    "Bagus",
    "Gilang",
    "Hendra",
    "Kevin",
    "Prasetyo",
    "Satria",
  ];
  const lastNames = [
    "Siregar",
    "Hartono",
    "Santoso",
    "Saputra",
    "Anggraini",
    "Pratama",
    "Wicaksono",
    "Mahendra",
    "Wijaya",
    "Kusuma",
    "Mahardika",
    "Utami",
    "Syafira",
    "Manurung",
    "Permana",
    "Wijayanti",
  ];

  const teacherCount = 32;
  const teachers: TeacherRecord[] = [];

  for (let index = 0; index < teacherCount; index += 1) {
    const isFemale = index % 2 === 0;
    const firstName = isFemale
      ? femaleNames[index % femaleNames.length]
      : maleNames[index % maleNames.length];
    const lastName = lastNames[(index * 3) % lastNames.length];
    const prefix = isFemale ? "Ibu" : "Pak";
    const fullName = `${prefix} ${firstName} ${lastName}`;
    const subject = subjects[index % subjects.length];
    const teacherId = `tch_${slugify(firstName)}_${slugify(lastName)}_${pad(index + 1, 2)}`;

    teachers.push({
      id: teacherId,
      fullName,
      nip: `${1970 + (index % 20)}${pad((index % 12) + 1, 2)}${pad(
        ((index * 2) % 28) + 1,
        2
      )} ${200300 + index} ${isFemale ? 2 : 1} ${pad(index + 1, 3)}`,
      email: `${slugify(firstName)}.${slugify(lastName)}@harapannusantara.sch.id`,
      phone: `0812${pad(300000 + index * 37, 7)}`,
      mainSubjectId: subject.id,
      active: index % 11 !== 0,
    });
  }

  return teachers;
}

function createClasses(term: TermRecord, teachers: TeacherRecord[]): ClassRecord[] {
  const definitions: Array<{ code: string; level: number; track: Track }> = [
    { code: "X-IPA-1", level: 10, track: "IPA" },
    { code: "X-IPA-2", level: 10, track: "IPA" },
    { code: "X-IPS-1", level: 10, track: "IPS" },
    { code: "X-IPS-2", level: 10, track: "IPS" },
    { code: "XI-IPA-1", level: 11, track: "IPA" },
    { code: "XI-IPA-2", level: 11, track: "IPA" },
    { code: "XI-IPS-1", level: 11, track: "IPS" },
    { code: "XI-IPS-2", level: 11, track: "IPS" },
    { code: "XII-IPA-1", level: 12, track: "IPA" },
    { code: "XII-IPS-1", level: 12, track: "IPS" },
  ];

  return definitions.map((klass, index) => {
    const teacher = teachers[(index * 2) % teachers.length];
    const classSlug = slugify(klass.code);
    return {
      id: index === 0 ? "class_x_ipa_1" : `class_${classSlug}`,
      code: klass.code,
      name: `Kelas ${klass.code.replace("-", " ")}`,
      level: klass.level,
      track: klass.track,
      homeroomId: teacher.id,
      termId: term.id,
    };
  });
}

function createClassSubjects(
  classes: ClassRecord[],
  subjects: SubjectRecord[],
  teachers: TeacherRecord[]
): {
  classSubjects: ClassSubjectRecord[];
  classSubjectsByClass: Map<string, ClassSubjectRecord[]>;
} {
  const coreSubjects = ["BIN", "ENG", "MAT", "SEJ", "PPKN", "AGM", "PJOK"];
  const ipaSubjects = ["MAT-P", "FIS", "KIM", "BIO", "TIK", "SENI"];
  const ipsSubjects = ["SOS", "EKO", "GEO", "TIK", "SENI"];
  const subjectByCode = new Map(subjects.map((subject) => [subject.code, subject]));

  const subjectTeacherMap = new Map<string, string[]>();
  teachers.forEach((teacher) => {
    const list = subjectTeacherMap.get(teacher.mainSubjectId) ?? [];
    list.push(teacher.id);
    subjectTeacherMap.set(teacher.mainSubjectId, list);
  });

  const subjectTeacherIndex = new Map<string, number>();
  const classSubjects: ClassSubjectRecord[] = [];
  const classSubjectsByClass = new Map<string, ClassSubjectRecord[]>();

  classes.forEach((klass) => {
    const subjectsForClass = new Set<string>(coreSubjects);
    if (klass.track === "IPA") {
      ipaSubjects.forEach((code) => subjectsForClass.add(code));
    } else {
      ipsSubjects.forEach((code) => subjectsForClass.add(code));
    }

    const list: ClassSubjectRecord[] = [];
    Array.from(subjectsForClass).forEach((code, idx) => {
      const subject = subjectByCode.get(code);
      if (!subject) return;

      const teacherCandidates = subjectTeacherMap.get(subject.id) ?? [];
      const pointer = subjectTeacherIndex.get(subject.id) ?? 0;
      const teacherId =
        teacherCandidates.length > 0
          ? teacherCandidates[pointer % teacherCandidates.length]
          : teachers[(idx + pointer) % teachers.length].id;
      subjectTeacherIndex.set(subject.id, pointer + 1);

      const classSlug = klass.id.replace("class_", "");
      const baseId =
        klass.id === "class_x_ipa_1" && subject.code === "MAT"
          ? "cs_xipa_mat"
          : `cs_${classSlug}_${subject.code.toLowerCase()}`;

      const entry: ClassSubjectRecord = {
        id: baseId,
        classroomId: klass.id,
        subjectId: subject.id,
        teacherId,
        termId: klass.termId,
      };
      classSubjects.push(entry);
      list.push(entry);
    });
    classSubjectsByClass.set(klass.id, list);
  });

  return { classSubjects, classSubjectsByClass };
}

function createStudents(classes: ClassRecord[]): {
  students: StudentRecord[];
  studentsByClass: Map<string, StudentRecord[]>;
} {
  const maleNames = [
    "Aditya",
    "Bagas",
    "Candra",
    "Dimas",
    "Eka",
    "Fajar",
    "Gilang",
    "Hendra",
    "Ilham",
    "Johan",
    "Kevin",
    "Lutfi",
    "Miko",
    "Nanda",
    "Oka",
    "Prasetyo",
    "Raka",
    "Surya",
    "Tirta",
    "Yoga",
  ];
  const femaleNames = [
    "Anisa",
    "Bella",
    "Citra",
    "Dewi",
    "Eka",
    "Fitri",
    "Gita",
    "Hanna",
    "Indira",
    "Jelita",
    "Kirana",
    "Lestari",
    "Maya",
    "Nadira",
    "Olivia",
    "Putri",
    "Qiana",
    "Rani",
    "Salsabila",
    "Vania",
  ];
  const lastNames = [
    "Wijaya",
    "Saputra",
    "Pratama",
    "Sari",
    "Utami",
    "Halim",
    "Anggraini",
    "Santoso",
    "Mahendra",
    "Kusuma",
    "Permana",
    "Syafira",
    "Manurung",
    "Siregar",
    "Mahardika",
    "Juliani",
    "Wijayanti",
    "Rahmadi",
    "Hardy",
    "Mulia",
  ];
  const guardianNames = [
    "Bambang",
    "Sulastri",
    "Hendra",
    "Yuliana",
    "Agus",
    "Ratna",
    "Dedi",
    "Kartika",
    "Slamet",
    "Nurhayati",
    "Bagus",
    "Rini",
    "Gatot",
    "Mulyani",
    "Adi",
    "Siti",
    "Joko",
    "Endah",
    "Rahman",
    "Indah",
  ];

  const canonicalPerClass: Record<string, Array<Partial<StudentRecord>>> = {
    "X-IPA-1": [
      {
        id: "stu_aditya_wijaya",
        nis: "2024-010",
        fullName: "Aditya Wijaya",
        gender: "M",
        birthDate: "2008-11-20",
        guardian: "Bambang Wijaya",
        guardianPhone: "081234567890",
        guardianEmail: "bambang.wijaya@example.local",
        status: "active",
      },
      {
        id: "stu_sri_rahayu",
        nis: "2024-011",
        fullName: "Sri Rahayu",
        gender: "F",
        birthDate: "2009-03-12",
        guardian: "Sulastri",
        guardianPhone: "081345678901",
        guardianEmail: "sulastri@example.local",
        status: "active",
      },
    ],
    "XI-IPS-1": [
      {
        id: "stu_nabila_pratiwi",
        nis: "2024-012",
        fullName: "Nabila Pratiwi",
        gender: "F",
        birthDate: "2008-08-04",
        guardian: "Hendra Pratama",
        guardianPhone: "081356789012",
        guardianEmail: "hendra.pratama@example.local",
        status: "active",
      },
      {
        id: "stu_raffael_putra",
        nis: "2024-013",
        fullName: "Raffael Putra",
        gender: "M",
        birthDate: "2009-02-01",
        guardian: "Yuliana Putri",
        guardianPhone: "081367890123",
        guardianEmail: "yuliana.putri@example.local",
        status: "active",
      },
    ],
  };

  const students: StudentRecord[] = [];
  const studentsByClass = new Map<string, StudentRecord[]>();
  let sequence = 0;

  classes.forEach((klass, classIndex) => {
    const classStudents: StudentRecord[] = [];
    const canonical = canonicalPerClass[klass.code] ?? [];
    canonical.forEach((entry, idx) => {
      const guardianPhone = entry.guardianPhone ?? `0813${pad(450000 + classIndex * 100 + idx, 7)}`;
      const guardianEmail =
        entry.guardianEmail ??
        `${slugify(entry.fullName ?? `wali_${klass.code}_${idx}`)}@example.local`;
      const student: StudentRecord = {
        id:
          entry.id ??
          `stu_${slugify(entry.fullName ?? `${klass.code}_Siswa_${idx + 1}`)}_${pad(sequence + 1, 4)}`,
        nis: entry.nis ?? `2024-${pad(sequence + 20, 3)}`,
        fullName:
          entry.fullName ??
          `${femaleNames[(sequence + idx) % femaleNames.length]} ${
            lastNames[(sequence + idx) % lastNames.length]
          }`,
        gender: (entry.gender as "M" | "F") ?? (idx % 2 === 0 ? "F" : "M"),
        birthDate:
          entry.birthDate ??
          `${2007 + (12 - klass.level)}-${pad(((sequence + idx) % 12) + 1, 2)}-${pad(
            ((sequence * 3 + idx) % 27) + 1,
            2
          )}`,
        guardian: entry.guardian ?? guardianNames[(sequence + idx) % guardianNames.length],
        guardianPhone,
        guardianEmail,
        classId: klass.id,
        status: entry.status ?? "active",
      };
      classStudents.push(student);
      students.push(student);
      sequence += 1;
    });

    const targetSize = 30;
    for (let offset = classStudents.length; offset < targetSize; offset += 1) {
      const globalIndex = sequence + offset;
      const isMale = (offset + classIndex) % 2 === 0;
      const firstName = isMale
        ? maleNames[globalIndex % maleNames.length]
        : femaleNames[globalIndex % femaleNames.length];
      const lastName = lastNames[(globalIndex * 2) % lastNames.length];
      const guardianName = guardianNames[(globalIndex + offset) % guardianNames.length];
      const status = (globalIndex + offset) % 18 === 0 ? "inactive" : "active";
      const birthYear = 2010 - (klass.level - 10) - (isMale ? 1 : 0);
      const month = pad(((globalIndex + offset) % 12) + 1, 2);
      const day = pad(((globalIndex * 3 + offset) % 26) + 1, 2);
      const fullName = `${firstName} ${lastName}`;

      const student: StudentRecord = {
        id: `stu_${slugify(firstName)}_${slugify(lastName)}_${pad(globalIndex + 1, 4)}`,
        nis: `2024-${pad(globalIndex + 100, 4)}`,
        fullName,
        gender: isMale ? "M" : "F",
        birthDate: `${birthYear}-${month}-${day}`,
        guardian: `${guardianName} ${lastName}`,
        guardianPhone: `0815${pad(500000 + globalIndex * 11, 7)}`,
        guardianEmail: `${slugify(guardianName)}.${slugify(lastName)}@example.local`,
        classId: klass.id,
        status,
      };
      classStudents.push(student);
      students.push(student);
    }

    sequence += targetSize - canonical.length;
    studentsByClass.set(klass.id, classStudents);
  });

  return { students, studentsByClass };
}

function createEnrollments(students: StudentRecord[], classes: ClassRecord[]): EnrollmentRecord[] {
  const classMap = new Map(classes.map((klass) => [klass.id, klass]));

  return students.map((student) => {
    const klass = classMap.get(student.classId);
    const defaultId = `enr_${student.id.replace(/^stu_/, "")}`;
    let id = defaultId;
    if (student.id === "stu_aditya_wijaya") id = "enr_aditya_xipa";
    if (student.id === "stu_sri_rahayu") id = "enr_sri_xipa";
    if (student.id === "stu_nabila_pratiwi") id = "enr_nabila_xiips";
    if (student.id === "stu_raffael_putra") id = "enr_raffael_xiips";

    return {
      id,
      studentId: student.id,
      classId: student.classId,
      termId: klass?.termId ?? "term_2024_ganjil",
    };
  });
}

function createSchedules(classSubjects: ClassSubjectRecord[]): ScheduleRecord[] {
  const slots = [
    { start: "07:00", end: "07:45" },
    { start: "07:50", end: "08:35" },
    { start: "08:40", end: "09:25" },
    { start: "09:40", end: "10:25" },
    { start: "10:30", end: "11:15" },
    { start: "11:20", end: "12:05" },
    { start: "12:45", end: "13:30" },
    { start: "13:35", end: "14:20" },
  ];

  return classSubjects.flatMap((mapping, index) => {
    const dayOfWeek = (index % 5) + 1;
    const slot = slots[index % slots.length];
    const room = `Ruang ${100 + ((index * 7) % 12)}`;

    return [
      {
        id: `sch_${mapping.id}_${pad(index + 1, 3)}`,
        classSubjectId: mapping.id,
        dayOfWeek,
        startTime: slot.start,
        endTime: slot.end,
        room,
        slot: (index % slots.length) + 1,
      },
    ];
  });
}

function createGradeComponents(classSubjects: ClassSubjectRecord[]): {
  gradeComponents: GradeComponentRecord[];
  gradeComponentMap: Map<string, GradeComponentRecord[]>;
} {
  const templates = [
    { key: "tugas", name: "Tugas Harian", weight: 30 },
    { key: "uh", name: "Ulangan Harian", weight: 30 },
    { key: "pas", name: "Penilaian Akhir Semester", weight: 40 },
  ];

  const gradeComponents: GradeComponentRecord[] = [];
  const gradeComponentMap = new Map<string, GradeComponentRecord[]>();

  classSubjects.forEach((mapping, index) => {
    const kkmBase = 70 + ((index * 3) % 8);
    const components = templates.map((template, idx) => {
      const id =
        mapping.id === "cs_xipa_mat" && template.key === "uh"
          ? "gc_mat_mid"
          : mapping.id === "cs_xipa_mat" && template.key === "pas"
            ? "gc_mat_final"
            : `gc_${mapping.id}_${template.key}`;

      return {
        id,
        name: template.name,
        weight: template.weight,
        classSubjectId: mapping.id,
        kkm: kkmBase + idx,
        description: `${template.name} ${mapping.subjectId.replace("sub_", "").toUpperCase()}`,
      };
    });
    gradeComponents.push(...components);
    gradeComponentMap.set(mapping.id, components);
  });

  return { gradeComponents, gradeComponentMap };
}

function createGradeConfigs(classSubjects: ClassSubjectRecord[]): GradeConfigRecord[] {
  return classSubjects.map((mapping, index) => ({
    id: mapping.id === "cs_xipa_mat" ? "gcfg_cs_xipa_mat" : `gcfg_${mapping.id}`,
    classSubjectId: mapping.id,
    scheme: index % 3 === 0 ? "WEIGHTED" : "AVERAGE",
    kkm: 70 + (index % 6),
    status: index % 4 === 0 ? "finalized" : "draft",
  }));
}

function createGrades(
  enrollments: EnrollmentRecord[],
  classSubjects: ClassSubjectRecord[],
  gradeComponents: GradeComponentRecord[],
  gradeComponentMap: Map<string, GradeComponentRecord[]>
): GradeRecord[] {
  const classSubjectByClass = new Map<string, ClassSubjectRecord[]>();
  classSubjects.forEach((mapping) => {
    const list = classSubjectByClass.get(mapping.classroomId) ?? [];
    list.push(mapping);
    classSubjectByClass.set(mapping.classroomId, list);
  });

  const componentById = new Map(gradeComponents.map((component) => [component.id, component]));

  const grades: GradeRecord[] = [];
  enrollments.forEach((enrollment, enrollIndex) => {
    const mappings = classSubjectByClass.get(enrollment.classId) ?? [];
    mappings.forEach((mapping, subjectIndex) => {
      const components = gradeComponentMap.get(mapping.id) ?? [];
      components.forEach((component, componentIndex) => {
        const seed =
          enrollIndex * 37 +
          subjectIndex * 19 +
          componentIndex * 11 +
          mapping.id.length * 5 +
          component.id.length * 3;
        const baseScore =
          60 +
          ((seed % 41) +
            Math.sin((seed % 13) * Math.PI) * 4 +
            Math.cos((seed % 17) * Math.PI * 0.5) * 5);
        const score = Math.min(100, Math.max(45, Math.round(baseScore)));
        const id =
          mapping.id === "cs_xipa_mat" && component.id === "gc_mat_mid"
            ? `grade_aditya_mid_mat_${enrollIndex}`
            : mapping.id === "cs_xipa_mat" && component.id === "gc_mat_final"
              ? `grade_aditya_final_mat_${enrollIndex}`
              : `grade_${mapping.id}_${component.id}_${pad(enrollIndex + 1, 4)}`;

        grades.push({
          id,
          enrollmentId: enrollment.id,
          subjectId: mapping.subjectId,
          componentId: component.id,
          score,
          teacherId: mapping.teacherId,
        });

        const componentMeta = componentById.get(component.id);
        if (
          mapping.id === "cs_xipa_mat" &&
          component.id === "gc_mat_mid" &&
          componentMeta &&
          enrollIndex === 0
        ) {
          grades[grades.length - 1].score = 82;
        }
        if (
          mapping.id === "cs_xipa_mat" &&
          component.id === "gc_mat_final" &&
          componentMeta &&
          enrollIndex === 0
        ) {
          grades[grades.length - 1].score = 88;
        }
      });
    });
  });

  return grades;
}

function createAttendance(
  enrollments: EnrollmentRecord[],
  classSubjects: ClassSubjectRecord[],
  schedules: ScheduleRecord[],
  studentsByClass: Map<string, StudentRecord[]>,
  classSubjectsByClass: Map<string, ClassSubjectRecord[]>,
  teachers: TeacherRecord[]
): AttendanceRecord[] {
  const attendance: AttendanceRecord[] = [];
  const enrollmentIndexMap = new Map<string, number>();
  enrollments.forEach((enrollment, idx) => enrollmentIndexMap.set(enrollment.id, idx));

  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const scheduleByClassSubject = new Map<string, ScheduleRecord[]>();
  schedules.forEach((schedule) => {
    const list = scheduleByClassSubject.get(schedule.classSubjectId) ?? [];
    list.push(schedule);
    scheduleByClassSubject.set(schedule.classSubjectId, list);
  });

  const isoDay = (value: string) => {
    const [year, month, day] = value.split("-").map((part) => Number.parseInt(part ?? "1", 10));
    const dt = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
    const dayOfWeek = dt.getUTCDay();
    return dayOfWeek === 0 ? 7 : dayOfWeek;
  };

  const buildTimestamp = (date: string, seed: number) => {
    const base = new Date(`${date}T07:00:00.000Z`);
    const shifted = new Date(base.getTime() + seed * 7 * 60 * 1000);
    return shifted.toISOString();
  };

  enrollments.forEach((enrollment) => {
    const classStudents = studentsByClass.get(enrollment.classId) ?? [];
    const studentIndex = classStudents.findIndex((student) => student.id === enrollment.studentId);
    const baseIndex = enrollmentIndexMap.get(enrollment.id) ?? 0;

    ATTENDANCE_DATES.forEach((date, dateIndex) => {
      const statusCycle = ["H", "H", "H", "H", "H", "S", "H", "H", "I", "H", "H", "A"];
      const status =
        statusCycle[(studentIndex + baseIndex + dateIndex) % statusCycle.length] ?? statusCycle[0];
      const note =
        status === "S"
          ? "Surat keterangan dokter"
          : status === "I"
            ? "Izin menghadiri kejuaraan olahraga"
            : status === "A"
              ? "Tidak hadir tanpa keterangan"
              : undefined;

      attendance.push({
        id: `att_${enrollment.id}_${date.replace(/-/g, "")}`,
        enrollmentId: enrollment.id,
        classId: enrollment.classId,
        date,
        status: status as AttendanceRecord["status"],
        sessionType: "Harian",
        note,
        recordedAt: buildTimestamp(date, studentIndex + baseIndex + dateIndex),
        updatedAt: buildTimestamp(date, studentIndex + baseIndex + dateIndex + 1),
      });
    });
  });

  classSubjectsByClass.forEach((mappings, classId) => {
    const keySubjects = mappings.slice(0, 3);
    MAPEL_ATTENDANCE_DATES.forEach((date, dateIndex) => {
      keySubjects.forEach((mapping, subjectIndex) => {
        const teacher = teacherById.get(mapping.teacherId);
        const scheduleList = scheduleByClassSubject.get(mapping.id) ?? [];
        const dayOfWeek = isoDay(date);
        const scheduleForDay =
          scheduleList.find((schedule) => schedule.dayOfWeek === dayOfWeek) ?? scheduleList[0];
        const slotNumber = scheduleForDay?.slot ?? ((subjectIndex + dateIndex) % 6) + 1;

        enrollments
          .filter((enrollment) => enrollment.classId === classId)
          .forEach((enrollment, enrollIndex) => {
            const statusCycle = ["H", "H", "H", "S", "H", "H", "H", "I", "H", "H"];
            const status =
              statusCycle[(enrollIndex + subjectIndex + dateIndex) % statusCycle.length] ??
              statusCycle[0];
            const note =
              status === "S"
                ? "Demam tinggi"
                : status === "I"
                  ? "Mengikuti lomba"
                  : status === "A"
                    ? "Belum memberikan keterangan"
                    : undefined;

            attendance.push({
              id: `att_${enrollment.id}_${mapping.id}_${date.replace(/-/g, "")}`,
              enrollmentId: enrollment.id,
              classId,
              date,
              status: status as AttendanceRecord["status"],
              sessionType: "Mapel",
              subjectId: mapping.subjectId,
              teacherId: teacher?.id ?? mapping.teacherId,
              slot: slotNumber,
              note,
              recordedAt: buildTimestamp(date, enrollIndex + subjectIndex + dateIndex),
              updatedAt: buildTimestamp(date, enrollIndex + subjectIndex + dateIndex + 1),
            });
          });
      });
    });
  });

  return attendance;
}

function createTeacherPreferences(teachers: TeacherRecord[]): TeacherPreferenceRecord[] {
  const dayPatterns: Array<{
    preferred: number[];
    blocked: number[];
    level: "HIGH" | "MEDIUM" | "LOW";
    note: string;
  }> = [
    {
      preferred: [1, 2, 3, 4, 5],
      blocked: [],
      level: "HIGH",
      note: "Fleksibel mengajar sepanjang minggu.",
    },
    {
      preferred: [1, 2, 3, 4],
      blocked: [5, 6],
      level: "MEDIUM",
      note: "Menghindari Jumat dan Sabtu untuk kegiatan laboratorium.",
    },
    { preferred: [1, 2, 3], blocked: [6], level: "MEDIUM", note: "Lebih fokus di awal pekan." },
    {
      preferred: [2, 3, 4, 5],
      blocked: [1],
      level: "MEDIUM",
      note: "Tidak tersedia setiap Senin karena koordinasi kurikulum.",
    },
    {
      preferred: [1, 2],
      blocked: [5, 6],
      level: "LOW",
      note: "Jadwal mengajar padat di sekolah lain.",
    },
  ];

  const slotPatterns: Array<number[]> = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [1, 2, 5, 6],
    [3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
  ];

  return teachers.map((teacher, index) => {
    const dayPattern = dayPatterns[index % dayPatterns.length];
    const preferredSlots = slotPatterns[index % slotPatterns.length];
    const maxDailySessions = 2 + (index % 3);
    return {
      id: `pref_${teacher.id}`,
      teacherId: teacher.id,
      preferredDays: [...dayPattern.preferred],
      blockedDays: [...dayPattern.blocked],
      preferredSlots,
      maxDailySessions,
      availabilityLevel: dayPattern.level,
      notes: dayPattern.note,
    };
  });
}

function createSemesterSchedule(
  classes: ClassRecord[],
  classSubjects: ClassSubjectRecord[],
  preferences: TeacherPreferenceRecord[]
): SemesterScheduleSlotRecord[] {
  const schedule: SemesterScheduleSlotRecord[] = [];
  const slotsPerDay = 8;
  const days = [1, 2, 3, 4, 5, 6];

  const preferredDayLookup = new Map<string, Set<number>>();
  const preferredSlotLookup = new Map<string, Set<number>>();
  preferences.forEach((pref) => {
    preferredDayLookup.set(pref.teacherId, new Set(pref.preferredDays));
    preferredSlotLookup.set(pref.teacherId, new Set(pref.preferredSlots));
  });

  classes.forEach((klass, classIndex) => {
    const relatedSubjects = classSubjects.filter((item) => item.classroomId === klass.id);
    const teacherRotation = [...relatedSubjects];

    days.forEach((day) => {
      for (let slot = 1; slot <= slotsPerDay; slot += 1) {
        const assignmentIndex =
          (classIndex * days.length * slotsPerDay + (day - 1) * slotsPerDay + (slot - 1)) %
          teacherRotation.length;
        const mapping = teacherRotation[assignmentIndex];
        if (!mapping) {
          schedule.push({
            id: `sem_${klass.id}_${day}_${slot}`,
            classId: klass.id,
            dayOfWeek: day,
            slot,
            teacherId: null,
            subjectId: null,
            status: "EMPTY",
          });
          continue;
        }

        const preferredDays = preferredDayLookup.get(mapping.teacherId) ?? new Set<number>();
        const preferredSlots = preferredSlotLookup.get(mapping.teacherId) ?? new Set<number>();
        const inPreference = preferredDays.has(day) && preferredSlots.has(slot);

        schedule.push({
          id: `sem_${klass.id}_${day}_${slot}`,
          classId: klass.id,
          dayOfWeek: day,
          slot,
          teacherId: mapping.teacherId,
          subjectId: mapping.subjectId,
          status: inPreference ? "PREFERENCE" : "COMPROMISE",
          locked: inPreference && slot % 3 === 0,
        });
      }
    });
  });

  return schedule;
}

function createCalendarEvents(
  terms: TermRecord[],
  classes: ClassRecord[],
  teachers: TeacherRecord[]
): CalendarEventRecord[] {
  const activeTerm = terms.find((term) => term.active) ?? terms[0];
  const otherTerm = terms.find((term) => term.id !== activeTerm.id) ?? terms[0];

  const classIdsByLevel = classes.reduce<Record<number, string[]>>((acc, klass) => {
    if (!acc[klass.level]) {
      acc[klass.level] = [];
    }
    acc[klass.level].push(klass.id);
    return acc;
  }, {});

  const organizerAcademic =
    teachers.find((teacher) => teacher.fullName.toLowerCase().includes("kurikulum"))?.fullName ??
    "Waka Kurikulum";
  const organizerStudentAffairs =
    teachers.find((teacher) => teacher.fullName.toLowerCase().includes("kesiswaan"))?.fullName ??
    "Kesiswaan";

  return [
    {
      id: "cal_mpls_2024",
      title: "Masa Pengenalan Lingkungan Sekolah",
      description:
        "Orientasi siswa baru dengan tur kampus, pengenalan budaya sekolah, dan sesi penguatan karakter.",
      category: "SCHOOL_ACTIVITY",
      startDate: "2024-07-15",
      endDate: "2024-07-17",
      termId: activeTerm.id,
      organizer: organizerStudentAffairs,
      location: "Aula & Lingkungan Sekolah",
      createdById: "user_admin_tu",
      audience: "SISWA",
      relatedClassIds: [...(classIdsByLevel[10] ?? [])],
      tags: ["MPLS", "Siswa Baru"],
      allDay: true,
      source: "MANUAL",
    },
    {
      id: "cal_effective_block1",
      title: "Hari Efektif Pembelajaran Blok 1",
      description: "Rencana belajar inti untuk memasuki materi semester ganjil.",
      category: "EFFECTIVE_DAY",
      startDate: "2024-07-22",
      endDate: "2024-08-16",
      termId: activeTerm.id,
      organizer: "Tim Akademik",
      createdById: "user_admin_tu",
      audience: "ALL",
      relatedClassIds: classes.map((klass) => klass.id),
      tags: ["Pembelajaran", "Blok 1"],
      allDay: true,
      source: "MANUAL",
    },
    {
      id: "cal_libur_kemerdekaan",
      title: "Libur Nasional: Hari Kemerdekaan",
      description: "Memperingati Hari Kemerdekaan Republik Indonesia ke-79.",
      category: "HOLIDAY",
      startDate: "2024-08-17",
      endDate: "2024-08-18",
      termId: activeTerm.id,
      organizer: "Pemerintah RI",
      location: "Seluruh Indonesia",
      createdById: "user_admin_tu",
      audience: "ALL",
      tags: ["Libur Nasional"],
      allDay: true,
      source: "SYNTHETIC",
    },
    {
      id: "cal_rapat_kurikulum_sep",
      title: "Rapat Koordinasi Kurikulum",
      description:
        "Evaluasi perangkat ajar, pembagian modul projek P5, dan sinkronisasi jadwal remedial.",
      category: "MEETING",
      startDate: "2024-09-03T09:00:00+07:00",
      endDate: "2024-09-03T11:30:00+07:00",
      termId: activeTerm.id,
      organizer: organizerAcademic,
      location: "Ruang Rapat Kepala Sekolah",
      createdById: "user_admin_tu",
      audience: "GURU",
      tags: ["Rapat", "Kurikulum"],
      relatedClassIds: [],
      source: "MANUAL",
    },
    {
      id: "cal_exkul_it_fair",
      title: "Ekskul IT Fair & Lomba Coding",
      description:
        "Expo karya siswa dan lomba pemrograman antar kelas. Tim juri berasal dari alumni industri.",
      category: "EXTRACURRICULAR",
      startDate: "2024-09-21T08:00:00+07:00",
      endDate: "2024-09-21T14:00:00+07:00",
      termId: activeTerm.id,
      organizer: "Pembina OSIS",
      location: "Hall Serbaguna",
      createdById: "user_admin_tu",
      audience: "SISWA",
      relatedClassIds: [...(classIdsByLevel[10] ?? []), ...(classIdsByLevel[11] ?? [])],
      tags: ["OSIS", "Ekskul", "Teknologi"],
      source: "MANUAL",
    },
    {
      id: "cal_inactive_maintenance",
      title: "Hari Tidak Efektif: Pemeliharaan Gedung",
      description:
        "Perawatan instalasi listrik dan pengecatan ruang laboratorium. Seluruh kegiatan belajar dialihkan daring.",
      category: "INACTIVE_DAY",
      startDate: "2024-11-02",
      endDate: "2024-11-03",
      termId: activeTerm.id,
      organizer: "Tim Sarpras",
      createdById: "user_admin_tu",
      audience: "ALL",
      relatedClassIds: classes.map((klass) => klass.id),
      tags: ["Pemeliharaan", "Sarpras"],
      allDay: true,
      source: "MANUAL",
    },
    {
      id: "cal_kickoff_semester_genap",
      title: "Kick-off Persiapan Semester Genap",
      description:
        "Workshop strategi pembelajaran tematik dan penyelarasan proyek kewirausahaan semester genap.",
      category: "MEETING",
      startDate: `${otherTerm.startDate}T08:30:00+07:00`,
      endDate: `${otherTerm.startDate}T12:00:00+07:00`,
      termId: otherTerm.id,
      organizer: organizerAcademic,
      location: "Ruang Multimedia",
      createdById: "user_admin_tu",
      audience: "GURU",
      tags: ["Workshop", "Persiapan Semester"],
      relatedClassIds: [],
      source: "MANUAL",
    },
  ];
}

function createExamEvents(
  terms: TermRecord[],
  classes: ClassRecord[],
  subjects: SubjectRecord[]
): ExamEventRecord[] {
  const activeTerm = terms.find((term) => term.active) ?? terms[0];
  const otherTerm = terms.find((term) => term.id !== activeTerm.id) ?? terms[0];
  const allClasses = classes.map((klass) => klass.id);
  const grade11Classes = classes.filter((klass) => klass.level === 11).map((klass) => klass.id);
  const grade12Classes = classes.filter((klass) => klass.level === 12).map((klass) => klass.id);

  const mathSubject =
    subjects.find((subject) => subject.code === "MAT") ??
    subjects.find((subject) => subject.name.toLowerCase().includes("matematika"));

  return [
    {
      id: "exam_pts_ganjil",
      name: "Ujian Tengah Semester Ganjil",
      termId: activeTerm.id,
      examType: "PTS",
      startDate: "2024-10-08",
      endDate: "2024-10-12",
      scope: "SCHOOL",
      relatedClassIds: allClasses,
      organizer: "Waka Kurikulum",
      description:
        "Penilaian tengah semester ganjil untuk seluruh jurusan dengan format terintegrasi AKM.",
      publishedAt: "2024-09-25T02:00:00+07:00",
      tags: ["Penilaian", "AKM"],
    },
    {
      id: "exam_tryout_utbk",
      name: "Try Out UTBK Nasional",
      termId: activeTerm.id,
      examType: "TRYOUT",
      startDate: "2024-11-18",
      endDate: "2024-11-19",
      scope: "GRADE",
      relatedClassIds: grade12Classes,
      organizer: "Bimbingan Konseling",
      description:
        "Simulasi UTBK bersama platform Mitra Prestasi untuk memetakan kesiapan siswa kelas XII.",
      publishedAt: "2024-10-20T04:00:00+07:00",
      tags: ["UTBK", "Kelas XII"],
    },
    {
      id: "exam_praktik_seni",
      termId: activeTerm.id,
      name: "Ujian Praktik Seni Budaya",
      examType: "PRAKTEK",
      startDate: "2024-11-25",
      endDate: "2024-11-27",
      scope: "GRADE",
      relatedClassIds: grade11Classes,
      organizer: "Guru Seni Budaya",
      description: `Gelaran karya praktik Seni Budaya terintegrasi dengan tema proyek Profil Pelajar Pancasila. Fokus pada ${mathSubject?.name ?? "mata pelajaran seni"}.`,
      publishedAt: "2024-11-05T03:00:00+07:00",
      tags: ["Praktik", "P5"],
    },
    {
      id: "exam_pas_ganjil",
      name: "Penilaian Akhir Semester Ganjil",
      termId: activeTerm.id,
      examType: "PAS",
      startDate: "2024-12-16",
      endDate: "2024-12-20",
      scope: "SCHOOL",
      relatedClassIds: allClasses,
      organizer: "Waka Kurikulum",
      description: "PAS ganjil seluruh mapel sebagai penentu rapor semester.",
      publishedAt: "2024-11-30T01:30:00+07:00",
      tags: ["Penilaian", "Rapor"],
    },
    {
      id: "exam_pts_genap",
      name: "Ujian Tengah Semester Genap",
      termId: otherTerm.id,
      examType: "PTS",
      startDate: "2025-03-10",
      endDate: "2025-03-15",
      scope: "SCHOOL",
      relatedClassIds: allClasses,
      organizer: "Waka Kurikulum",
      description: "Simulasi Ujian Tengah Semester Genap untuk persiapan kelulusan.",
      publishedAt: "2025-02-14T02:00:00+07:00",
      tags: ["Penilaian", "Semester Genap"],
    },
  ];
}

function createAnnouncements(classes: ClassRecord[]): AnnouncementRecord[] {
  const classTargets = classes.slice(0, 3).map((klass) => `CLASS:${klass.id}`);
  return [
    {
      id: "ann_rapor_semester",
      title: "Pembagian Rapor Semester Ganjil",
      body: "Pembagian rapor dilaksanakan Jumat, 20 Desember 2024 pukul 08:00 di aula sekolah. Diharap orang tua hadir.",
      audience: "ALL",
      publishAt: "2024-12-15T01:00:00.000Z",
      publishedAt: "2024-12-15T05:00:00.000Z",
      authorId: "user_superadmin",
      pinned: true,
    },
    {
      id: "ann_workshop_km",
      title: "Workshop Kurikulum Merdeka",
      body: "Seluruh guru wajib mengikuti workshop pada 5 Januari 2025. Agenda meliputi penyusunan modul ajar tematik.",
      audience: "GURU",
      publishAt: "2024-12-18T02:00:00.000Z",
      publishedAt: "2024-12-18T02:05:00.000Z",
      authorId: "user_superadmin",
    },
    {
      id: "ann_sosialisasi_unbk",
      title: "Sosialisasi UNBK & AKM 2025",
      body: "Siswa kelas XII wajib hadir pada sosialisasi UNBK & AKM 2025 yang dilaksanakan Senin, 6 Januari 2025.",
      audience: "SISWA",
      publishAt: "2024-12-22T04:00:00.000Z",
      publishedAt: "2024-12-22T04:10:00.000Z",
      authorId: "user_superadmin",
    },
    ...classTargets.map((audience, idx) => ({
      id: `ann_class_${idx + 1}`,
      title: "Simulasi Penilaian Tengah Semester",
      body: "Simulasi PTS akan dilaksanakan pekan depan. Pastikan seluruh siswa mengikuti arahan wali kelas.",
      audience: audience as AnnouncementRecord["audience"],
      publishAt: `2024-08-${pad(10 + idx, 2)}T01:00:00.000Z`,
      publishedAt: `2024-08-${pad(10 + idx, 2)}T01:15:00.000Z`,
      authorId: "user_wali_kelas",
    })),
  ];
}

function createBehaviorNotes(
  students: StudentRecord[],
  classes: ClassRecord[]
): BehaviorNoteRecord[] {
  const categories: BehaviorNoteRecord["category"][] = [
    "Kedisiplinan",
    "Prestasi",
    "Intervensi",
    "Kesehatan",
  ];
  const notes: BehaviorNoteRecord[] = [];

  students.slice(0, 24).forEach((student, index) => {
    const klass = classes.find((item) => item.id === student.classId);
    if (!klass) return;
    notes.push({
      id: `bn_${student.id}`,
      studentId: student.id,
      classroomId: klass.id,
      createdById: klass.homeroomId,
      date: `2024-08-${pad((index % 28) + 1, 2)}`,
      category: categories[index % categories.length],
      note:
        index % 4 === 0
          ? "Perlu pendampingan untuk manajemen waktu dan ketepatan hadir apel pagi."
          : index % 4 === 1
            ? "Memenangkan lomba debat tingkat kota dan menjadi duta sekolah."
            : index % 4 === 2
              ? "Mengikuti sesi konseling rutin untuk peningkatan motivasi belajar."
              : "Mengalami cedera ringan, sudah ditangani UKS dan mendapat izin istirahat.",
    });
  });

  return notes;
}

function createMutations(
  students: StudentRecord[],
  classes: ClassRecord[],
  teachers: TeacherRecord[]
): MutationRecord[] {
  const classById = new Map(classes.map((klass) => [klass.id, klass]));
  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const dataset = students.filter((student) => student.status === "inactive").slice(0, 8);

  return dataset.map((student, index) => {
    const currentClass = classById.get(student.classId);
    const targetClass = classes[(index + 3) % classes.length];
    const handler = teacherById.get(currentClass?.homeroomId ?? teachers[0].id) ?? teachers[0];
    const type: MutationRecord["type"] =
      index % 3 === 0 ? "IN" : index % 3 === 1 ? "OUT" : "INTERNAL";

    return {
      id: `mut_${student.id}`,
      studentId: student.id,
      studentName: student.fullName,
      type,
      effectiveDate: `2024-09-${pad((index % 20) + 1, 2)}`,
      fromClassId: type === "IN" ? null : (currentClass?.id ?? null),
      fromClassName: type === "IN" ? null : (currentClass?.name ?? null),
      toClassId: type === "OUT" ? null : targetClass.id,
      toClassName: type === "OUT" ? null : targetClass.name,
      reason:
        type === "IN"
          ? "Mengikuti kepindahan orang tua dinas dan melanjutkan di sekolah ini."
          : type === "OUT"
            ? "Orang tua mutasi kerja ke luar kota sehingga siswa pindah sekolah."
            : "Penyesuaian jalur peminatan untuk mendukung fokus belajar siswa.",
      handledById: handler.id,
      handledByName: handler.fullName,
      auditTrail: [
        {
          id: `audit_${student.id}_submitted`,
          timestamp: `2024-08-${pad((index % 25) + 5, 2)}T02:00:00.000Z`,
          actorId: "user_superadmin",
          actorName: "Super Admin",
          action: "REQUEST_SUBMITTED",
          details: "Permohonan diterima melalui portal sekolah.",
        },
        {
          id: `audit_${student.id}_verified`,
          timestamp: `2024-08-${pad((index % 25) + 7, 2)}T05:30:00.000Z`,
          actorId: handler.id,
          actorName: handler.fullName,
          action: "DOCUMENT_VERIFIED",
          details: "Seluruh dokumen pendukung diverifikasi oleh wali kelas.",
        },
        {
          id: `audit_${student.id}_final`,
          timestamp: `2024-09-${pad((index % 25) + 1, 2)}T08:15:00.000Z`,
          actorId: "user_superadmin",
          actorName: "Super Admin",
          action: type === "OUT" ? "RECORD_RELEASED" : "ENROLLMENT_UPDATED",
          details:
            type === "OUT"
              ? "Dokumen mutasi telah diunggah dan diserahkan kepada orang tua."
              : "Data siswa diperbarui dan dijadwalkan orientasi kelas baru.",
        },
      ],
    };
  });
}

function createArchives(term: TermRecord, classCount: number): ArchiveRecord[] {
  return [
    {
      id: "archive_rapor_semester_ganjil",
      termId: term.id,
      termName: term.name,
      type: "REPORT_PDF",
      label: `Rapor Semester ${term.semester === 1 ? "Ganjil" : "Genap"} ${term.year}`,
      format: "zip",
      fileName: "rapor_semester_ganjil_2024-2025.zip",
      fileSize: 104857600 + classCount * 204800,
      checksum: checksum(term.id + term.endDate),
      downloadUrl: "https://example-cdn.local/files/rapor_semester_ganjil_2024-2025.zip",
      generatedAt: "2024-12-22T02:15:00.000Z",
      generatedBy: "user_superadmin",
    },
    {
      id: "archive_absensi_semester_ganjil",
      termId: term.id,
      termName: term.name,
      type: "ATTENDANCE_CSV",
      label: "Absensi Harian Semester Ganjil 2024/2025",
      format: "csv",
      fileName: "absensi_semester_ganjil_2024-2025.csv",
      fileSize: 4096000 + classCount * 102400,
      checksum: checksum(term.id + term.startDate),
      downloadUrl: "https://example-cdn.local/files/absensi_semester_ganjil_2024-2025.csv",
      generatedAt: "2024-12-21T10:45:00.000Z",
      generatedBy: "user_superadmin",
    },
    {
      id: "archive_grade_midterm",
      termId: term.id,
      termName: term.name,
      type: "GRADE_XLSX",
      label: "Rekap Nilai Tengah Semester",
      format: "xlsx",
      fileName: "rekap_nilai_pts_2024-2025.xlsx",
      fileSize: 2048000,
      checksum: checksum("grade_midterm"),
      downloadUrl: "https://example-cdn.local/files/rekap_nilai_pts_2024-2025.xlsx",
      generatedAt: "2024-10-20T06:30:00.000Z",
      generatedBy: "user_admin_tu",
    },
  ];
}

function calculateFinalScores(
  grades: GradeRecord[],
  gradeComponents: GradeComponentRecord[]
): Map<string, number> {
  const componentById = new Map(gradeComponents.map((component) => [component.id, component]));
  const scores = new Map<string, { totalWeight: number; weightedSum: number }>();

  grades.forEach((grade) => {
    const component = componentById.get(grade.componentId);
    if (!component) return;
    const key = `${grade.enrollmentId}:${grade.subjectId}`;
    const current = scores.get(key) ?? { totalWeight: 0, weightedSum: 0 };
    current.totalWeight += component.weight;
    current.weightedSum += (grade.score ?? 0) * component.weight;
    scores.set(key, current);
  });

  const finalScores = new Map<string, number>();
  scores.forEach((value, key) => {
    if (value.totalWeight > 0) {
      finalScores.set(key, Number((value.weightedSum / value.totalWeight).toFixed(2)));
    }
  });

  return finalScores;
}

function createDashboard(
  term: TermRecord,
  classes: ClassRecord[],
  enrollments: EnrollmentRecord[],
  classSubjects: ClassSubjectRecord[],
  gradeComponents: GradeComponentRecord[],
  grades: GradeRecord[],
  attendance: AttendanceRecord[],
  subjects: SubjectRecord[],
  students: StudentRecord[]
): DashboardRecord {
  const finalScores = calculateFinalScores(grades, gradeComponents);
  const enrollmentById = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
  const classById = new Map(classes.map((klass) => [klass.id, klass]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const studentById = new Map(students.map((student) => [student.id, student]));

  const classScores = new Map<string, number[]>();
  finalScores.forEach((score, key) => {
    const [enrollmentId] = key.split(":");
    const enrollment = enrollmentById.get(enrollmentId);
    if (!enrollment) return;
    const list = classScores.get(enrollment.classId) ?? [];
    list.push(score);
    classScores.set(enrollment.classId, list);
  });

  const byClass = Array.from(classScores.entries()).map(([classId, scores]) => {
    const klass = classById.get(classId);
    const average =
      scores.length > 0
        ? Number((scores.reduce((acc, value) => acc + value, 0) / scores.length).toFixed(2))
        : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    return {
      classId,
      className: klass?.name ?? classId,
      average,
      highest,
      lowest,
    };
  });

  const studentAverageMap = new Map<string, number>();
  enrollments.forEach((enrollment) => {
    const studentScores: number[] = [];
    classSubjects
      .filter((mapping) => mapping.classroomId === enrollment.classId)
      .forEach((mapping) => {
        const score = finalScores.get(`${enrollment.id}:${mapping.subjectId}`);
        if (typeof score === "number") {
          studentScores.push(score);
        }
      });
    if (studentScores.length > 0) {
      const average = studentScores.reduce((acc, value) => acc + value, 0) / studentScores.length;
      studentAverageMap.set(enrollment.studentId, Number(average.toFixed(2)));
    }
  });

  const studentAverages = Array.from(studentAverageMap.values());
  const overallAverage =
    studentAverages.length > 0
      ? Number(
          (studentAverages.reduce((acc, value) => acc + value, 0) / studentAverages.length).toFixed(
            2
          )
        )
      : 0;

  const byRange = [
    { range: "90-100", count: studentAverages.filter((score) => score >= 90).length },
    {
      range: "80-89",
      count: studentAverages.filter((score) => score >= 80 && score < 90).length,
    },
    {
      range: "70-79",
      count: studentAverages.filter((score) => score >= 70 && score < 80).length,
    },
    { range: "<70", count: studentAverages.filter((score) => score < 70).length },
  ];

  const sorted = Array.from(studentAverageMap.entries()).sort((a, b) => b[1] - a[1]);
  const topStudents = sorted.slice(0, 3);
  const bottomStudents = sorted.slice(-3);

  const outliers = [...topStudents, ...bottomStudents].map(([studentId, score], index) => {
    const enrollment = enrollments.find((item) => item.studentId === studentId);
    const klass = classById.get(enrollment?.classId ?? "");
    const subject = classSubjects.find((mapping) => mapping.classroomId === enrollment?.classId);
    return {
      studentId,
      studentName: studentById.get(studentId)?.fullName ?? studentId,
      classId: klass?.id ?? "",
      className: klass?.name ?? "",
      subjectId: subject?.subjectId ?? "",
      subjectName: subjectById.get(subject?.subjectId ?? "")?.name ?? "Matematika",
      zScore: Number(((score - overallAverage) / 6).toFixed(2)),
      score,
      trend: index < 3 ? "UP" : "DOWN",
      lastUpdated: "2024-08-25T08:30:00.000Z",
    };
  });

  const remedial = Array.from(finalScores.entries())
    .map(([key, score]) => {
      const [enrollmentId, subjectId] = key.split(":");
      const enrollment = enrollmentById.get(enrollmentId);
      if (!enrollment) return null;
      const klass = classById.get(enrollment.classId);
      const student = students.find((item) => item.id === enrollment.studentId);
      const subject = subjectById.get(subjectId);
      const kkm =
        gradeComponents.find(
          (component) =>
            component.classSubjectId ===
            classSubjects.find(
              (mapping) =>
                mapping.classroomId === enrollment.classId && mapping.subjectId === subjectId
            )?.id
        )?.kkm ?? 75;
      if (score >= kkm - 2) return null;
      return {
        studentId: enrollment.studentId,
        studentName: student?.fullName ?? enrollment.studentId,
        classId: klass?.id ?? "",
        className: klass?.name ?? "",
        subjectId,
        subjectName: subject?.name ?? subjectId,
        score,
        kkm,
        attempts: 1 + ((score + enrollment.classId.length) % 2),
        lastAttempt: "2024-08-18",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 8);

  const attendanceByClass = new Map<string, { present: number; total: number }>();
  attendance.forEach((record) => {
    const stat = attendanceByClass.get(record.classId) ?? { present: 0, total: 0 };
    stat.total += 1;
    if (record.status === "H") stat.present += 1;
    attendanceByClass.set(record.classId, stat);
  });

  const attendanceByClassArray = Array.from(attendanceByClass.entries()).map(([classId, stat]) => {
    const klass = classById.get(classId);
    const percentage = stat.total > 0 ? Number(((stat.present / stat.total) * 100).toFixed(2)) : 0;
    return {
      classId,
      className: klass?.name ?? classId,
      percentage,
    };
  });

  const alerts = attendanceByClassArray
    .filter((entry) => entry.percentage < 92)
    .map((entry) => ({
      classId: entry.classId,
      className: entry.className,
      indicator: "ABSENCE_SPIKE",
      percentage: entry.percentage,
      week: "2024-W34",
    }));

  const totalAttendance = Array.from(attendanceByClass.values()).reduce(
    (acc, value) => {
      acc.present += value.present;
      acc.total += value.total;
      return acc;
    },
    { present: 0, total: 0 }
  );

  const overallAttendancePercentage =
    totalAttendance.total > 0
      ? Number(((totalAttendance.present / totalAttendance.total) * 100).toFixed(2))
      : 0;

  return {
    termId: term.id,
    updatedAt: "2024-09-01T02:00:00.000Z",
    distribution: {
      overallAverage,
      totalStudents: students.length,
      byRange,
      byClass,
    },
    outliers,
    remedial,
    attendance: {
      overall: overallAttendancePercentage,
      byClass: attendanceByClassArray,
      alerts,
    },
  };
}
