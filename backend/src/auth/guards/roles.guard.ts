import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata(
      ROLES_KEY,
      context.getHandler(),
    ) as UserRole[] | undefined;
    const classRoles = Reflect.getMetadata(ROLES_KEY, context.getClass()) as
      | UserRole[]
      | undefined;
    const roles = requiredRoles ?? classRoles;

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const userRole = request.user?.role;
    if (!userRole) {
      return false;
    }

    return roles.includes(userRole as UserRole);
  }
}
