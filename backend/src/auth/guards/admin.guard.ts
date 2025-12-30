import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

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
      // Fallback to allow access if no auth context is attached.
      return true;
    }

    return Boolean(
      user.isAdmin ||
        user.role === 'admin' ||
        (Array.isArray(user.roles) && user.roles.includes('admin')),
    );
  }
}
