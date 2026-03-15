import { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserRole } from '../../users/user.entity';

describe('AdminGuard', () => {
  const makeContext = (user?: {
    role?: string;
    roles?: string[];
    isAdmin?: boolean;
    email?: string;
  }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('returns false when request has no user', () => {
    const guard = new AdminGuard();

    expect(guard.canActivate(makeContext(undefined))).toBe(false);
  });

  it('returns true for ADMIN role and super admin email', () => {
    const guard = new AdminGuard();

    expect(
      guard.canActivate(
        makeContext({ role: UserRole.ADMIN, email: 'erivanf10@gmail.com' }),
      ),
    ).toBe(true);
  });

  it('returns false for ADMIN role with non-super-admin email', () => {
    const guard = new AdminGuard();

    expect(
      guard.canActivate(
        makeContext({ role: UserRole.ADMIN, email: 'other@example.com' }),
      ),
    ).toBe(false);
  });

  it('returns true when roles array contains admin and email matches', () => {
    const guard = new AdminGuard();

    expect(
      guard.canActivate(
        makeContext({ roles: ['user', 'admin'], email: 'ERIVANF10@GMAIL.COM' }),
      ),
    ).toBe(true);
  });

  it('returns true when isAdmin flag is true and email matches', () => {
    const guard = new AdminGuard();

    expect(
      guard.canActivate(
        makeContext({ isAdmin: true, email: 'erivanf10@gmail.com' }),
      ),
    ).toBe(true);
  });

  it('returns false when only super admin email matches without admin privileges', () => {
    const guard = new AdminGuard();

    expect(
      guard.canActivate(makeContext({ role: UserRole.USER, email: 'erivanf10@gmail.com' })),
    ).toBe(false);
  });
});
