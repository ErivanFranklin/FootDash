import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { ProfileDto } from './dto/profile.dto';

export interface AuthUser {
  id: string;
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
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterAuthDto): Promise<AuthResult> {
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
      });
      if (!stored || stored.revoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = stored.user;
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.createTokens({
        id: user.id,
        email: user.email,
      });
      return { user: { id: user.id, email: user.email }, tokens };
    } catch {
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

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // map DB snake_case -> API camelCase explicitly to match ProfileDto
    return {
      id: user.id,
      email: user.email,
      createdAt: (user as any).created_at,
    } as ProfileDto;
  }

  private async createTokens(user: AuthUser): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
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
}
