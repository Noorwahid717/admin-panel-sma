import type { Role } from "@shared/constants";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  teacherId?: string | null;
  studentId?: string | null;
}
