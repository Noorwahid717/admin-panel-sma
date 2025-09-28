export const ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "OPERATOR",
  "TEACHER",
  "HOMEROOM",
  "STUDENT",
  "PARENT",
] as const;

export type Role = (typeof ROLES)[number];
