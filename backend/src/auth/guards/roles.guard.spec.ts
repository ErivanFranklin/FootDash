import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/user.entity';

describe('RolesGuard', () => {
  const makeContext = (userRole?: string): ExecutionContext => {
    const handler = function handler() {};
    class TestController {}

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when no roles metadata is defined', () => {
    const guard = new RolesGuard();
    const ctx = makeContext(UserRole.USER);
    jest.spyOn(Reflect, 'getMetadata').mockReturnValue(undefined);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when handler role metadata matches user role', () => {
    const guard = new RolesGuard();
    const ctx = makeContext(UserRole.ADMIN);
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockImplementation((key, target) => {
        if (target === ctx.getHandler()) {
          return [UserRole.ADMIN];
        }

        return undefined;
      });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when role metadata exists but user has no role', () => {
    const guard = new RolesGuard();
    const ctx = makeContext(undefined);
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockImplementation((key, target) => {
        if (target === ctx.getHandler()) {
          return [UserRole.ADMIN];
        }

        return undefined;
      });

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('falls back to class-level roles metadata when handler has none', () => {
    const guard = new RolesGuard();
    const ctx = makeContext(UserRole.MODERATOR);
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockImplementation((key, target) => {
        if (target === ctx.getHandler()) {
          return undefined;
        }
        if (target === ctx.getClass()) {
          return [UserRole.MODERATOR];
        }

        return undefined;
      });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when user role is not in required roles', () => {
    const guard = new RolesGuard();
    const ctx = makeContext(UserRole.USER);
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockImplementation((key, target) => {
        if (target === ctx.getHandler()) {
          return [UserRole.ADMIN, UserRole.MODERATOR];
        }

        return undefined;
      });

    expect(guard.canActivate(ctx)).toBe(false);
  });
});
