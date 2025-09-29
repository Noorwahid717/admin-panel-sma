import { asc, eq } from "drizzle-orm";
import type { Database } from "@api/db/client";
import {
  classes,
  enrollments,
  gradeComponents,
  grades,
  reportJobs,
  students,
  subjects,
  terms,
} from "@api/db/schema";
import type { ReportPdfPayload, ReportSubjectComponent, ReportSubjectSummary } from "./pdf";

export async function loadReportContext(db: Database, jobId: string) {
  const rows = await db
    .select({
      job: reportJobs,
      enrollment: enrollments,
      student: students,
      class: classes,
      term: terms,
    })
    .from(reportJobs)
    .innerJoin(enrollments, eq(reportJobs.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .where(eq(reportJobs.id, jobId))
    .limit(1);

  const context = rows.at(0);

  if (!context) {
    throw new Error(`Report job ${jobId} not found`);
  }

  return context;
}

function buildSubjectSummaries(
  gradeRows: Array<{
    grade: typeof grades.$inferSelect;
    component: typeof gradeComponents.$inferSelect;
    subject: typeof subjects.$inferSelect;
  }>
): ReportSubjectSummary[] {
  const subjectsMap = new Map<string, ReportSubjectSummary>();

  for (const row of gradeRows) {
    const subject = subjectsMap.get(row.subject.id);
    const component: ReportSubjectComponent = {
      id: row.component.id,
      name: row.component.name,
      weight: row.component.weight,
      score: row.grade.score,
    };

    if (!subject) {
      subjectsMap.set(row.subject.id, {
        id: row.subject.id,
        name: row.subject.name,
        averageScore: null,
        components: [component],
      });
      continue;
    }

    subject.components.push(component);
  }

  for (const summary of subjectsMap.values()) {
    const totalWeight = summary.components.reduce((acc, component) => acc + component.weight, 0);
    if (totalWeight > 0) {
      const weightedSum = summary.components.reduce(
        (acc, component) => acc + component.score * component.weight,
        0
      );
      summary.averageScore = weightedSum / totalWeight;
    } else if (summary.components.length > 0) {
      const simpleAverage =
        summary.components.reduce((acc, component) => acc + component.score, 0) /
        summary.components.length;
      summary.averageScore = simpleAverage;
    } else {
      summary.averageScore = null;
    }
  }

  return Array.from(subjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function buildReportPdfPayload(
  db: Database,
  jobId: string
): Promise<ReportPdfPayload> {
  const context = await loadReportContext(db, jobId);

  const gradeRows = await db
    .select({
      grade: grades,
      component: gradeComponents,
      subject: subjects,
    })
    .from(grades)
    .innerJoin(gradeComponents, eq(grades.componentId, gradeComponents.id))
    .innerJoin(subjects, eq(grades.subjectId, subjects.id))
    .where(eq(grades.enrollmentId, context.enrollment.id))
    .orderBy(asc(subjects.name), asc(gradeComponents.name));

  const subjectsSummary = buildSubjectSummaries(gradeRows);

  return {
    jobId: context.job.id,
    generatedAt: new Date().toISOString(),
    student: {
      id: context.student.id,
      name: context.student.fullName,
      nis: context.student.nis,
      guardian: context.student.guardian,
    },
    class: {
      id: context.class.id,
      name: context.class.name,
      level: context.class.level,
    },
    term: {
      id: context.term.id,
      name: context.term.name,
      startDate: context.term.startDate?.toISOString?.() ?? context.term.startDate.toString(),
      endDate: context.term.endDate?.toISOString?.() ?? context.term.endDate.toString(),
    },
    subjects: subjectsSummary,
  };
}
