import { SetMetadata } from "@nestjs/common";

export type OwnershipResource =
  | "class"
  | "subject"
  | "enrollment"
  | "grade"
  | "attendance"
  | "report";

export interface OwnershipMetadata {
  resource: OwnershipResource;
  paramKey?: string;
}

export const OWNERSHIP_KEY = "ownership";

export const Ownership = (resource: OwnershipResource, paramKey = "id") =>
  SetMetadata(OWNERSHIP_KEY, { resource, paramKey });
