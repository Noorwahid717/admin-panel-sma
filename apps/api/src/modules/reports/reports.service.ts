import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import type { ReportPdfJobData, ReportRequestInput } from "@shared/schemas";
import type { Database } from "@shared/db/client";
import { classes, enrollments, reportJobs, students, terms } from "@shared/db/schema";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { OwnershipService } from "../../common/services/ownership.service";
import type { AppRole, RequestUser } from "@api/auth/auth.types";
import type { Queue } from "bullmq";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import { REPORT_PDF_QUEUE } from "../../infrastructure/queue/queue.constants";
import { nanoid } from "nanoid";

const ADMIN_ROLES = new Set<AppRole>(["SUPERADMIN", "ADMIN", "OPERATOR"]);

type ReportJobRow = {
  job: typeof reportJobs.$inferSelect;
  enrollment: typeof enrollments.$inferSelect;
  student: typeof students.$inferSelect;
  class: typeof classes.$inferSelect;
  term: typeof terms.$inferSelect;
};

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: Database,
    private readonly ownershipService: OwnershipService,
    @Inject(REPORT_PDF_QUEUE) private readonly reportQueue: Queue
  ) {}

  private isAdmin(user: RequestUser) {
    return ADMIN_ROLES.has(user.role);
  }

  private async ensureEnrollmentAccess(user: RequestUser, enrollmentId: string) {
    const canAccess = await this.ownershipService.canAccessEnrollment(user, enrollmentId);
    if (!canAccess) {
      throw new UnauthorizedException("Forbidden");
    }
  }

  private async loadJobWithRelations(whereClause: SQL<unknown>) {
    const [row] = await this.db
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
      .where(whereClause)
      .limit(1);

    return row as ReportJobRow | undefined;
  }

  async request(user: RequestUser, payload: ReportRequestInput) {
    await this.ensureEnrollmentAccess(user, payload.enrollmentId);

    const existing = await this.db.query.reportJobs.findFirst({
      where: eq(reportJobs.enrollmentId, payload.enrollmentId),
    });

    const now = new Date();
    let jobRecord: typeof reportJobs.$inferSelect;

    if (existing) {
      const [updated] = await this.db
        .update(reportJobs)
        .set({
          status: "pending",
          pdfUrl: null,
          requestedBy: user.id,
          updatedAt: now,
        })
        .where(eq(reportJobs.id, existing.id))
        .returning();
      jobRecord = updated;
    } else {
      const [created] = await this.db
        .insert(reportJobs)
        .values({
          id: nanoid(),
          enrollmentId: payload.enrollmentId,
          status: "pending",
          pdfUrl: null,
          requestedBy: user.id,
        })
        .returning();
      jobRecord = created;
    }

    const jobPayload: ReportPdfJobData = {
      reportJobId: jobRecord.id,
      enrollmentId: jobRecord.enrollmentId,
      requestedBy: user.id,
    };

    await this.reportQueue.add("generate-report", jobPayload, {
      jobId: jobRecord.id,
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });

    const row = await this.loadJobWithRelations(eq(reportJobs.id, jobRecord.id));
    if (!row) {
      throw new NotFoundException("Report job not found after creation");
    }

    return row;
  }

  async list(user: RequestUser, status?: string) {
    const conditions = [];

    if (status) {
      conditions.push(eq(reportJobs.status, status));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await this.db
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
      .where(whereClause)
      .orderBy(desc(reportJobs.createdAt));

    if (this.isAdmin(user)) {
      return rows as ReportJobRow[];
    }

    const filtered: ReportJobRow[] = [];

    for (const row of rows as ReportJobRow[]) {
      const canAccess = await this.ownershipService.canAccessEnrollment(user, row.enrollment.id);
      if (canAccess) {
        filtered.push(row);
      }
    }

    return filtered;
  }

  async findById(user: RequestUser, id: string) {
    const row = await this.loadJobWithRelations(eq(reportJobs.id, id));

    if (!row) {
      throw new NotFoundException("Report job not found");
    }

    const canAccess = await this.ownershipService.canAccessEnrollment(user, row.enrollment.id);
    if (!canAccess) {
      throw new UnauthorizedException("Forbidden");
    }

    return row;
  }

  async findByEnrollment(user: RequestUser, enrollmentId: string) {
    await this.ensureEnrollmentAccess(user, enrollmentId);

    const row = await this.loadJobWithRelations(eq(reportJobs.enrollmentId, enrollmentId));

    if (!row) {
      throw new NotFoundException("Report job not found");
    }

    return row;
  }
}
