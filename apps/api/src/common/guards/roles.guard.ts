import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@shared/constants";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector?.getAllAndOverride?.<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ??
      Reflect.getMetadata(ROLES_KEY, context.getHandler()) ??
      Reflect.getMetadata(ROLES_KEY, context.getClass());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Role } | undefined;

    if (!user?.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
