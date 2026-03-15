import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginAudit } from './entities/login-audit.entity';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: any;
  let resetRepo: any;
  let refreshRepo: any;
  let mailService: any;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn(),
      findOneByOrFail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    refreshRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    resetRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: resetRepo,
        },
        {
          provide: getRepositoryToken(LoginAudit),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a new user and returns tokens', async () => {
    (usersRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
    const savedUser = {
      id: 1,
      email: 'a@b.com',
      passwordHash: 'x',
      role: UserRole.USER,
    } as any;
    (usersRepo.create as jest.Mock).mockReturnValue(savedUser);
    (usersRepo.save as jest.Mock).mockResolvedValue(savedUser);

    const res = await service.register({
      email: 'a@b.com',
      password: 'secret',
    } as any);
    expect(res.user.id).toBe(1);
    expect(res.user.email).toBe('a@b.com');
    expect(res.user.role).toBe(UserRole.USER);
    expect(res.tokens.accessToken).toBeDefined();
    expect(res.tokens.refreshToken).toBeDefined();
  });

  it('throws on register when email exists', async () => {
    (usersRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 2 } as any);
    await expect(
      service.register({ email: 'a@b.com', password: 'x' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws on invalid refresh token', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refreshes tokens for valid refresh token', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 5 });
    (usersRepo.findOneBy as jest.Mock).mockResolvedValue({
      id: 5,
      email: 'test@example.com',
      role: UserRole.ADMIN,
    } as any);
    (refreshRepo.findOne as jest.Mock).mockResolvedValue({
      token: 'valid-token',
      revoked: false,
      user: { id: 5, email: 'test@example.com', role: UserRole.ADMIN },
    });

    const res = await service.refresh('valid-token');
    expect(res.user.id).toBe(5);
    expect(res.user.email).toBe('test@example.com');
    expect(res.user.role).toBe(UserRole.ADMIN);
    expect(res.tokens.accessToken).toBeDefined();
    expect(res.tokens.refreshToken).toBeDefined();
  });

  it('serializes role into JWT access token payload', async () => {
    const signSpy = jwtService.sign as jest.Mock;
    signSpy.mockClear();

    (usersRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
    const savedUser = {
      id: 9,
      email: 'role@example.com',
      password_hash: 'hash',
      role: UserRole.MODERATOR,
    } as any;
    (usersRepo.create as jest.Mock).mockReturnValue(savedUser);
    (usersRepo.save as jest.Mock).mockResolvedValue(savedUser);

    await service.register({
      email: 'role@example.com',
      password: 'StrongPass123!',
    } as any);

    const firstPayload = signSpy.mock.calls[0]?.[0];
    expect(firstPayload.role).toBe(UserRole.MODERATOR);
  });

  it('revokes a refresh token', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 5 });
    (refreshRepo.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      token: 'to-be-revoked',
      revoked: false,
    });
    (refreshRepo.save as jest.Mock).mockResolvedValue({
      id: 10,
      token: 'to-be-revoked',
      revoked: true,
    });

    await expect(service.revoke('to-be-revoked')).resolves.toBeUndefined();
    expect((refreshRepo.save as jest.Mock).mock.calls.length).toBeGreaterThan(
      0,
    );
  });

  it('normalizes login email by trimming and lowercasing', async () => {
    const hash = await bcrypt.hash('Password123!', 10);
    (usersRepo.findOneBy as jest.Mock).mockResolvedValue({
      id: 77,
      email: 'erivanf10@gmail.com',
      password_hash: hash,
      role: UserRole.USER,
      twoFactorEnabled: false,
    } as any);

    await service.login({
      email: '  ErivanF10@GMAIL.COM  ',
      password: 'Password123!',
    } as any);

    expect(usersRepo.findOneBy as jest.Mock).toHaveBeenCalledWith({
      email: 'erivanf10@gmail.com',
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for non-existent user', async () => {
      (usersRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.login({ email: 'none@test.com', password: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for invalid password', async () => {
      const hash = await bcrypt.hash('real-pass', 10);
      (usersRepo.findOneBy as jest.Mock).mockResolvedValue({ email: 'a@b.com', password_hash: hash });
      await expect(service.login({ email: 'a@b.com', password: 'wrong-pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns requiresTwoFactor if enabled and no code provided', async () => {
      const hash = await bcrypt.hash('pass', 10);
      (usersRepo.findOneBy as jest.Mock).mockResolvedValue({ 
        email: 'a@b.com', 
        password_hash: hash, 
        twoFactorEnabled: true 
      });
      const res = await service.login({ email: 'a@b.com', password: 'pass' });
      expect(res).toEqual({ requiresTwoFactor: true });
    });
  });

  describe('refresh details', () => {
    it('throws if refresh token valid but sub missing', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({}); // Missing sub
      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws if refresh token not in database', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1 });
      refreshRepo.findOne.mockResolvedValue(null);
      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('handles token reuse attack by revoking family', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1 });
      refreshRepo.findOne.mockResolvedValue({ revoked: true, id: 99 });
      refreshRepo.update = jest.fn().mockResolvedValue({});
      
      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
      expect(refreshRepo.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('successfully resets password with valid token', async () => {
      const mockToken = {
        userId: 1,
        usedAt: null,
        expiresAt: new Date(Date.now() + 10000),
        user: { id: 1 }
      };
      resetRepo.findOne.mockResolvedValue(mockToken);
      
      await service.resetPassword({ token: 'valid-token', newPassword: 'new-password' });
      
      expect(usersRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ password_hash: expect.any(String) }));
      expect(resetRepo.save).toHaveBeenCalled();
      expect(refreshRepo.update).toHaveBeenCalledWith({ user: { id: 1 } }, { revoked: true });
    });

    it('throws BadRequestException if token invalid or expired', async () => {
      resetRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPassword({ token: 'bad', newPassword: 'p' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('Session Management', () => {
    it('getSessions returns user sessions', async () => {
      refreshRepo.find.mockResolvedValue([{ id: 1, token: 't1' }, { id: 2, token: 't2' }]);
      const sessions = await service.getSessions(1, 't1');
      expect(sessions).toHaveLength(2);
      expect(sessions[0].current).toBe(true);
    });

    it('revokeSession revokes specific session', async () => {
      refreshRepo.findOne.mockResolvedValue({ id: 10, user: { id: 1 } });
      await service.revokeSession(1, 10);
      expect(refreshRepo.save).toHaveBeenCalledWith(expect.objectContaining({ revoked: true }));
    });

    it('revokeSession throws if not owners session', async () => {
      refreshRepo.findOne.mockResolvedValue({ id: 10, user: { id: 2 } });
      await expect(service.revokeSession(1, 10)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('setupTwoFactor', () => {
    it('generates a secret and QR code URL', async () => {
      (usersRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.com' });
      const result = await service.setupTwoFactor(1);
      expect(result.secret).toBeDefined();
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64/);
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws if user not found', async () => {
      (usersRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.setupTwoFactor(99)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns profile from usersRepo if profileService fails', async () => {
      (usersRepo.findOneByOrFail as jest.Mock).mockResolvedValue({ 
        id: 1, email: 'a@b.com', createdAt: new Date(), isPro: true, role: UserRole.USER 
      });
      const profile = await service.getProfile(1);
      expect(profile.email).toBe('a@b.com');
    });

    it('throws if user not found in fallback', async () => {
      (usersRepo.findOneByOrFail as jest.Mock).mockRejectedValue(new Error('not found'));
      await expect(service.getProfile(99)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Password Management', () => {
    it('changePassword updates password if current is correct', async () => {
      const hash = await bcrypt.hash('old-pass', 10);
      usersRepo.findOneBy.mockResolvedValue({ id: 1, password_hash: hash });
      
      await service.changePassword(1, 'old-pass', 'new-pass');
      expect(usersRepo.update).toHaveBeenCalled();
    });

    it('changePassword throws if current password incorrect', async () => {
      const hash = await bcrypt.hash('old-pass', 10);
      usersRepo.findOneBy.mockResolvedValue({ id: 1, password_hash: hash });
      
      await expect(service.changePassword(1, 'wrong-pass', 'new-pass')).rejects.toThrow(BadRequestException);
    });

    it('forgotPassword generates token and sends email', async () => {
      usersRepo.findOneBy.mockResolvedValue({ id: 1, email: 'test@test.com' });
      await service.forgotPassword({ email: 'test@test.com' });
      expect(usersRepo.findOneBy).toHaveBeenCalled();
    });

    it('forgotPassword returns silently for unknown email', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);
      await service.forgotPassword({ email: 'unknown@test.com' });
      expect(usersRepo.findOneBy).toHaveBeenCalled();
    });
  });

  describe('Two-Factor Logic Edge Cases', () => {
    it('consumeRecoveryCode handles invalid codes', async () => {
      const user = { twoFactorRecoveryCodes: 'hash1,hash2' } as any;
      // We need to access private method or trigger it via login
      const hash = await bcrypt.hash('pass', 10);
      usersRepo.findOneBy.mockResolvedValue({ 
        id: 1, 
        password_hash: hash, 
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: 'some-hash' 
      });
      
      await expect(service.login({ 
        email: 'a@b.com', 
        password: 'pass', 
        recoveryCode: 'WRONG-CODE' 
      })).rejects.toThrow(UnauthorizedException);
    });

    it('verifyTwoFactor throws if not setup', async () => {
      usersRepo.findOneBy.mockResolvedValue({ id: 1, twoFactorSecret: null });
      await expect(service.verifyTwoFactor(1, '123456')).rejects.toThrow(BadRequestException);
    });

    it('disableTwoFactor requires valid code', async () => {
      usersRepo.findOneBy.mockResolvedValue({ 
        id: 1, 
        twoFactorEnabled: true, 
        twoFactorSecret: 'JBSWY3DPEHPK3PXP' 
      });
      await expect(service.disableTwoFactor(1, '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('getTwoFactorStatus returns status', async () => {
      usersRepo.findOneBy.mockResolvedValue({ twoFactorEnabled: true, twoFactorRecoveryCodes: 'h1,h2' });
      const status = await service.getTwoFactorStatus(1);
      expect(status.enabled).toBe(true);
      expect(status.recoveryCodesRemaining).toBe(2);
    });

    it('resolveEffectiveRole handles edge cases', async () => {
      // Accessing private method via bracket notation
      const role1 = (service as any).resolveEffectiveRole(undefined, 'USER');
      expect(role1).toBe('USER');

      const role2 = (service as any).resolveEffectiveRole('erivanf10@gmail.com', 'USER');
      expect(role2).toBe('ADMIN');

      const role3 = (service as any).resolveEffectiveRole('other@mail.com', 'MODERATOR');
      expect(role3).toBe('MODERATOR');
    });

    it('forgotPassword handles mail service error', async () => {
      usersRepo.findOneBy.mockResolvedValue({ id: 1, email: 'a@b.com' });
      mailService.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP failure'));
      
      // Should not throw, just log
      await expect(service.forgotPassword({ email: 'a@b.com' })).resolves.toBeUndefined();
    });

    it('consumeRecoveryCode handles empty recovery codes string', async () => {
      const hash = await bcrypt.hash('pass', 10);
      usersRepo.findOneBy.mockResolvedValue({ 
        id: 1, 
        password_hash: hash, 
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: '' // empty string case
      });
      
      await expect(service.login({ 
        email: 'a@b.com', 
        password: 'pass', 
        recoveryCode: 'SOME-CODE' 
      })).rejects.toThrow(UnauthorizedException);
    });

    it('consumeRecoveryCode handles null recovery codes', async () => {
      const hash = await bcrypt.hash('pass', 10);
      usersRepo.findOneBy.mockResolvedValue({ 
        id: 1, 
        password_hash: hash, 
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: null
      });
      
      await expect(service.login({ 
        email: 'a@b.com', 
        password: 'pass', 
        recoveryCode: 'SOME-CODE' 
      })).rejects.toThrow(UnauthorizedException);
    });
  });
});
