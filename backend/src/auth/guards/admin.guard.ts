import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { UserRole } from '../../users/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request?.user as
      | { role?: string; roles?: string[]; isAdmin?: boolean }
      | undefined;

    if (!user) {
      return false;
    }

    return Boolean(
      user.isAdmin ||
        user.role === UserRole.ADMIN ||
        user.role?.toLowerCase() === 'admin' ||
        (Array.isArray(user.roles) &&
          (user.roles.includes(UserRole.ADMIN) ||
            user.roles.map(r => r.toLowerCase()).includes('admin'))),
    );
  }
}
