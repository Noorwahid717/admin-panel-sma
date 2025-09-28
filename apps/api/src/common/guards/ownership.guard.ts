import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OWNERSHIP_KEY, type OwnershipMetadata } from "../decorators/ownership.decorator";
import { OwnershipService } from "../services/ownership.service";
import type { AuthenticatedUser } from "../types/authenticated-user";

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownershipService: OwnershipService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<OwnershipMetadata | undefined>(
      OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      return false;
    }

    const targetId =
      request.params?.[metadata.paramKey ?? "id"] ??
      request.body?.[metadata.paramKey ?? "id"] ??
      request.query?.[metadata.paramKey ?? "id"];

    if (!targetId || typeof targetId !== "string") {
      return false;
    }

    switch (metadata.resource) {
      case "class":
        return this.ownershipService.canAccessClass(user, targetId);
      case "subject":
        return this.ownershipService.canAccessSubject(user, targetId);
      case "enrollment":
        return this.ownershipService.canAccessEnrollment(user, targetId);
      case "grade":
        return this.ownershipService.canAccessGrade(user, targetId);
      case "attendance":
        return this.ownershipService.canAccessAttendance(user, targetId);
      case "report":
        return this.ownershipService.canAccessReport(user, targetId);
      default:
        return false;
    }
  }
}
