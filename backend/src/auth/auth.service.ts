import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginAudit } from './entities/login-audit.entity';
import { UserProfileService } from '../users/services/user-profile.service';
import { Optional } from '@nestjs/common';
import { ProfileDto } from './dto/profile.dto';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/user.entity';

const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface AuthContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthChallenge {
  requiresTwoFactor: true;
}

export interface SessionView {
  id: number;
  createdAt: Date;
  lastUsedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  current: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL || 'erivanf10@gmail.com'
  ).toLowerCase();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetRepo: Repository<PasswordResetToken>,
    @InjectRepository(LoginAudit)
    private readonly loginAuditRepo: Repository<LoginAudit>,
    private readonly mailService: MailService,
    @Optional() private readonly profileService?: UserProfileService,
  ) {}

  async register(dto: RegisterAuthDto): Promise<AuthResult> {
    try {
      const email = this.normalizeEmail(dto.email);
      const existing = await this.usersRepo.findOneBy({ email });
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const created = this.usersRepo.create({
        email,
        password_hash: passwordHash,
      });
      const saved = await this.usersRepo.save(created);

      const tokens = await this.createTokens({
        id: saved.id,
        email: saved.email,
        role: this.resolveEffectiveRole(saved.email, saved.role),
      });
      return {
        user: {
          id: saved.id,
          email: saved.email,
          role: this.resolveEffectiveRole(saved.email, saved.role),
        },
        tokens,
      };
    } catch (error) {
       if (error instanceof ConflictException) throw error;
       console.error('Registration error details:', error);
       throw new InternalServerErrorException(error instanceof Error ? error.message : String(error));
    }
  }

  async login(dto: LoginAuthDto, context?: AuthContext): Promise<AuthResult | AuthChallenge> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersRepo.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      const hasTotp = !!dto.twoFactorCode;
      const hasRecoveryCode = !!dto.recoveryCode;
      if (!hasTotp && !hasRecoveryCode) {
        return { requiresTwoFactor: true };
      }

      if (hasRecoveryCode) {
        const consumed = await this.consumeRecoveryCode(user, dto.recoveryCode as string);
        if (!consumed) {
          throw new UnauthorizedException('Invalid two-factor recovery code');
        }
      } else {
        const verified = this.verifyTotpCode(user.twoFactorSecret, dto.twoFactorCode as string);
        if (!verified) {
          throw new UnauthorizedException('Invalid two-factor code');
        }
      }
    }

    const effectiveRole = this.resolveEffectiveRole(user.email, user.role);
    const tokens = await this.createTokens(
      { id: user.id, email: user.email, role: effectiveRole },
      context,
    );
    await this.recordLoginAudit(user, context);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: effectiveRole,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string, context?: AuthContext): Promise<AuthResult> {
    try {
      // verify refresh token and extract subject (user id)
      const payload: any = this.jwtService.verify(refreshToken);
      const userId = payload.sub;
      if (!userId) {
        this.logger.warn('[refresh] JWT valid but no sub claim');
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ensure this refresh token exists and is not revoked
      const stored = await this.refreshRepo.findOne({
        where: { token: refreshToken },
        relations: ['user'],
      });
      if (!stored || stored.revoked) {
        this.logger.warn(
          `[refresh] token lookup: found=${!!stored} revoked=${stored?.revoked} userId=${userId} tokenId=${stored?.id}`,
        );
        // Possible token reuse attack — revoke entire family
        if (stored) {
          await this.refreshRepo.update(
            { user: { id: userId } },
            { revoked: true },
          );
        }
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = stored.user;
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Rotate: revoke the old token before issuing a new pair
      stored.revoked = true;
      stored.lastUsedAt = new Date();
      await this.refreshRepo.save(stored);

      const tokens = await this.createTokens({
        id: user.id,
        email: user.email,
        role: this.resolveEffectiveRole(user.email, user.role),
      }, {
        ipAddress: context?.ipAddress ?? stored.ipAddress,
        userAgent: context?.userAgent ?? stored.userAgent,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: this.resolveEffectiveRole(user.email, user.role),
        },
        tokens,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revoke(refreshToken: string): Promise<void> {
    try {
      // verify token so only valid tokens can be revoked
      this.jwtService.verify(refreshToken);
      const stored = await this.refreshRepo.findOne({
        where: { token: refreshToken },
      });
      if (!stored) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      stored.revoked = true;
      await this.refreshRepo.save(stored);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: number): Promise<ProfileDto> {
    // Prefer profile record (which contains user relation/email) when available
    if (this.profileService) {
      try {
        const profile = await this.profileService.findByUserId(userId);
        return {
          id: profile.id,
          email: profile.email,
          createdAt: profile.createdAt,
          isPro: profile.isPro ?? false,
          role: this.resolveEffectiveRole(
            profile.email,
            profile.role ?? UserRole.USER,
          ),
        } as ProfileDto;
      } catch {
        // fallthrough to user lookup
      }
    }

        // Fallback to user record if profile service not available or profile not found
    try {
      const user = await this.usersRepo.findOneByOrFail({ id: userId });
      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        isPro: user.isPro,
        role: this.resolveEffectiveRole(user.email, user.role),
      } as ProfileDto;
    } catch {
      throw new UnauthorizedException('User not found');
    }
  }

  private async createTokens(user: AuthUser, context?: AuthContext): Promise<AuthTokens> {
    const effectiveRole = this.resolveEffectiveRole(user.email, user.role);
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: effectiveRole },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, role: effectiveRole },
      { expiresIn: '7d', jwtid: crypto.randomUUID() },
    );

    // Persist the refresh token so it can be revoked later.
    // In production you'd store a hashed token or a rotation ID; for simplicity we store the token text here.
    await this.refreshRepo.save(
      this.refreshRepo.create({
        token: refreshToken,
        user: { id: user.id } as any,
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
        lastUsedAt: new Date(),
      }),
    );

    return { accessToken, refreshToken };
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  async setupTwoFactor(userId: number): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = this.generateBase32Secret();
    const label = encodeURIComponent(`FootDash:${user.email}`);
    const issuer = encodeURIComponent('FootDash');
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    user.twoFactorSecret = secret;
    await this.usersRepo.save(user);

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  async verifyTwoFactor(userId: number, code: string): Promise<{ valid: boolean }> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor setup has not been initialized');
    }

    return { valid: this.verifyTotpCode(user.twoFactorSecret, code) };
  }

  async enableTwoFactor(userId: number, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor setup has not been initialized');
    }

    const valid = this.verifyTotpCode(user.twoFactorSecret, code);
    if (!valid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    const recoveryCodes = this.generateRecoveryCodes();
    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes.map((c) => this.hashRecoveryCode(c)).join(',');
    await this.usersRepo.save(user);

    return { recoveryCodes };
  }

  async disableTwoFactor(userId: number, code: string): Promise<void> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const valid = this.verifyTotpCode(user.twoFactorSecret, code);
    if (!valid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorRecoveryCodes = null;
    await this.usersRepo.save(user);
  }

  async getTwoFactorStatus(userId: number): Promise<{ enabled: boolean; recoveryCodesRemaining: number }> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const recoveryCodesRemaining = this.getStoredRecoveryCodeHashes(user).length;
    return {
      enabled: !!user.twoFactorEnabled,
      recoveryCodesRemaining,
    };
  }

  async getSessions(userId: number, currentRefreshToken?: string): Promise<SessionView[]> {
    const sessions = await this.refreshRepo.find({
      where: {
        user: { id: userId },
        revoked: false,
      },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      current: !!currentRefreshToken && session.token === currentRefreshToken,
    }));
  }

  async revokeSession(userId: number, sessionId: number): Promise<void> {
    const session = await this.refreshRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    if (!session || session.user.id !== userId) {
      throw new UnauthorizedException('Session not found');
    }

    session.revoked = true;
    session.lastUsedAt = new Date();
    await this.refreshRepo.save(session);
  }

  private verifyTotpCode(secret: string | null | undefined, code: string): boolean {
    if (!secret || !code) {
      return false;
    }

    const normalized = code.replace(/\s+/g, '');
    const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
    const buffer = this.base32ToBuffer(secret);

    for (let offset = -1; offset <= 1; offset += 1) {
      const candidate = this.generateHotp(buffer, currentCounter + offset, TOTP_DIGITS);
      if (candidate === normalized) {
        return true;
      }
    }

    return false;
  }

  private generateBase32Secret(): string {
    const random = crypto.randomBytes(20);
    return this.bufferToBase32(random);
  }

  private bufferToBase32(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32ToBuffer(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.replace(/=+$/g, '').toUpperCase();
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (const char of cleaned) {
      const index = alphabet.indexOf(char);
      if (index === -1) {
        continue;
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  private generateHotp(secret: Buffer, counter: number, digits: number): string {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', secret).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return String(code % 10 ** digits).padStart(digits, '0');
  }

  private generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
    }
    return codes;
  }

  private hashRecoveryCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code.replace(/-/g, '').toUpperCase())
      .digest('hex');
  }

  private getStoredRecoveryCodeHashes(user: User): string[] {
    if (!user.twoFactorRecoveryCodes) {
      return [];
    }

    return user.twoFactorRecoveryCodes
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private async consumeRecoveryCode(user: User, providedCode: string): Promise<boolean> {
    const hashes = this.getStoredRecoveryCodeHashes(user);
    if (hashes.length === 0) {
      return false;
    }

    const providedHash = this.hashRecoveryCode(providedCode);
    const index = hashes.indexOf(providedHash);
    if (index < 0) {
      return false;
    }

    hashes.splice(index, 1);
    user.twoFactorRecoveryCodes = hashes.length > 0 ? hashes.join(',') : null;
    await this.usersRepo.save(user);
    return true;
  }

  private async recordLoginAudit(user: User, context?: AuthContext): Promise<void> {
    await this.loginAuditRepo.save(
      this.loginAuditRepo.create({
        user: { id: user.id } as any,
        email: user.email,
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
      }),
    );
  }

  private resolveEffectiveRole(
    email: string | undefined,
    role: UserRole | undefined,
  ): UserRole {
    const normalizedEmail = (email || '').toLowerCase();
    if (normalizedEmail === this.superAdminEmail) {
      return UserRole.ADMIN;
    }
    if (role === UserRole.ADMIN) {
      return UserRole.ADMIN;
    }
    if (role === UserRole.MODERATOR) {
      return UserRole.MODERATOR;
    }
    return UserRole.USER;
  }

  // ─── Change Password (authenticated) ─────────────────────────

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.update(userId, { password_hash: hash });
    this.logger.log(`Password changed for user ${userId}`);
  }

  // ─── Forgot / Reset Password ─────────────────────────────────

  /**
   * Generate a reset token, store its SHA-256 hash, and email the raw token.
   * Always returns a success-like response to prevent email enumeration.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const email = dto.email.toLowerCase();
    const user = await this.usersRepo.findOneBy({ email });
    if (!user) {
      // Silently return to prevent revealing whether an account exists.
      this.logger.warn(`Forgot-password requested for unknown email: ${email}`);
      return;
    }

    // Generate a cryptographically random UUID-v4 token
    const rawToken = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.resetRepo.save(
      this.resetRepo.create({
        tokenHash,
        userId: user.id,
        expiresAt,
      }),
    );

    try {
      await this.mailService.sendPasswordResetEmail(email, rawToken);
    } catch (error) {
      this.logger.error(
        `Failed to deliver reset email for user ${user.id} (${email}). Returning generic success response.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Verify the raw token, set a new password, and mark the token as used.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const stored = await this.resetRepo.findOne({
      where: {
        tokenHash,
        usedAt: undefined as any, // IsNull() equivalent — usedAt is NULL
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!stored || stored.usedAt) {
      throw new BadRequestException(
        'Reset token is invalid or has expired. Please request a new one.',
      );
    }

    // Hash the new password and update the user
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.update(stored.userId, { password_hash: passwordHash });

    // Mark token as consumed
    stored.usedAt = new Date();
    await this.resetRepo.save(stored);

    // Revoke all refresh tokens for this user (force re-login)
    await this.refreshRepo.update(
      { user: { id: stored.userId } as any },
      { revoked: true },
    );

    this.logger.log(`Password reset completed for user ${stored.userId}`);
  }
}
