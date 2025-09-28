import { Inject, Injectable } from "@nestjs/common";
import type { Role } from "@shared/constants";
import type { AuthenticatedUser } from "../types/authenticated-user";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import {
  classes,
  enrollments,
  grades,
  scheduleEntries,
  teachingAssignments,
  attendance as attendanceTable,
} from "../../db/schema";
import { and, eq } from "drizzle-orm";

const ADMIN_ROLES: Role[] = ["SUPERADMIN", "ADMIN", "OPERATOR"];

@Injectable()
export class OwnershipService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: Database) {}

  private isAdmin(user: AuthenticatedUser) {
    return ADMIN_ROLES.includes(user.role);
  }

  async canAccessClass(user: AuthenticatedUser, classId: string) {
    if (this.isAdmin(user)) {
      return true;
    }

    if (!user.teacherId) {
      return false;
    }

    const classRecord = await this.db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classRecord) {
      return false;
    }

    if (user.role === "HOMEROOM" && classRecord.homeroomId === user.teacherId) {
      return true;
    }

    const teaching = await this.db.query.teachingAssignments.findFirst({
      where: and(
        eq(teachingAssignments.teacherId, user.teacherId),
        eq(teachingAssignments.classId, classId)
      ),
    });

    if (teaching) {
      return true;
    }

    const schedule = await this.db.query.scheduleEntries.findFirst({
      where: and(
        eq(scheduleEntries.classId, classId),
        eq(scheduleEntries.teacherId, user.teacherId)
      ),
    });

    return Boolean(schedule);
  }

  async canAccessSubject(user: AuthenticatedUser, subjectId: string) {
    if (this.isAdmin(user)) {
      return true;
    }
    if (!user.teacherId) {
      return false;
    }

    const assignment = await this.db.query.teachingAssignments.findFirst({
      where: and(
        eq(teachingAssignments.subjectId, subjectId),
        eq(teachingAssignments.teacherId, user.teacherId)
      ),
    });

    if (assignment) {
      return true;
    }

    const scheduled = await this.db.query.scheduleEntries.findFirst({
      where: and(
        eq(scheduleEntries.subjectId, subjectId),
        eq(scheduleEntries.teacherId, user.teacherId)
      ),
    });

    return Boolean(scheduled);
  }

  async canAccessEnrollment(user: AuthenticatedUser, enrollmentId: string) {
    if (this.isAdmin(user)) {
      return true;
    }

    const enrollmentRecord = await this.db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
    });

    if (!enrollmentRecord) {
      return false;
    }

    return this.canAccessClass(user, enrollmentRecord.classId);
  }

  async canAccessGrade(user: AuthenticatedUser, gradeId: string) {
    if (this.isAdmin(user)) {
      return true;
    }

    const gradeRecord = await this.db.query.grades.findFirst({
      where: eq(grades.id, gradeId),
    });

    if (!gradeRecord) {
      return false;
    }

    if (user.teacherId && gradeRecord.teacherId === user.teacherId) {
      return true;
    }

    return this.canAccessEnrollment(user, gradeRecord.enrollmentId);
  }

  async canAccessAttendance(user: AuthenticatedUser, attendanceId: string) {
    if (this.isAdmin(user)) {
      return true;
    }

    const attendanceRecord = await this.db.query.attendance.findFirst({
      where: eq(attendanceTable.id, attendanceId),
    });

    if (!attendanceRecord) {
      return false;
    }

    if (user.teacherId && attendanceRecord.teacherId === user.teacherId) {
      return true;
    }

    return this.canAccessEnrollment(user, attendanceRecord.enrollmentId);
  }

  async canAccessReport(user: AuthenticatedUser, enrollmentId: string) {
    if (this.isAdmin(user)) {
      return true;
    }

    return this.canAccessEnrollment(user, enrollmentId);
  }
}
