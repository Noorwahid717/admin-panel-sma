import type { Role } from "@shared/constants";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  fullName: string;
  teacherId?: string | null;
  studentId?: string | null;
  tokenId: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: "Bearer";
}
