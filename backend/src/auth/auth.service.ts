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
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UserProfileService } from '../users/services/user-profile.service';
import { Optional } from '@nestjs/common';
import { ProfileDto } from './dto/profile.dto';
import { MailService } from '../mail/mail.service';

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetRepo: Repository<PasswordResetToken>,
    private readonly mailService: MailService,
    @Optional() private readonly profileService?: UserProfileService,
  ) {}

  async register(dto: RegisterAuthDto): Promise<AuthResult> {
    try {
      const email = dto.email.toLowerCase();
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
      });
      return { user: { id: saved.id, email: saved.email }, tokens };
    } catch (error) {
       if (error instanceof ConflictException) throw error;
       console.error('Registration error details:', error);
       throw new InternalServerErrorException(error instanceof Error ? error.message : String(error));
    }
  }

  async login(dto: LoginAuthDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
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

    const tokens = await this.createTokens({ id: user.id, email: user.email });
    return { user: { id: user.id, email: user.email }, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      // verify refresh token and extract subject (user id)
      const payload: any = this.jwtService.verify(refreshToken);
      const userId = payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ensure this refresh token exists and is not revoked
      const stored = await this.refreshRepo.findOne({
        where: { token: refreshToken },
        relations: ['user'],
        order: { id: 'DESC' },
      });
      if (!stored || stored.revoked) {
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
      await this.refreshRepo.save(stored);

      const tokens = await this.createTokens({
        id: user.id,
        email: user.email,
      });
      return { user: { id: user.id, email: user.email }, tokens };
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
      } as ProfileDto;
    } catch {
      throw new UnauthorizedException('User not found');
    }
  }

  private async createTokens(user: AuthUser): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d', jwtid: crypto.randomUUID() },
    );

    // Persist the refresh token so it can be revoked later.
    // In production you'd store a hashed token or a rotation ID; for simplicity we store the token text here.
    await this.refreshRepo.save(
      this.refreshRepo.create({
        token: refreshToken,
        user: { id: user.id } as any,
      }),
    );

    return { accessToken, refreshToken };
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
