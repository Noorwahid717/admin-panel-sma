import type { Role } from "../../../shared/src/constants";

export type AppRole = Role;

export type RequestUser = {
  id: string;
  role: AppRole;
  teacherId?: string | null;
  studentId?: string | null;
};

export type OwnedEntity = {
  ownerId?: string | null;
  teacherId?: string | null;
  classId?: string | null;
};

export type AuthenticatedUser = RequestUser & {
  email: string;
  fullName: string;
};

export interface JwtPayload extends AuthenticatedUser {
  sub: string;
  tokenId: string;
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: "Bearer";
};
