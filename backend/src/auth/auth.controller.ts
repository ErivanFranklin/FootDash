import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthResult, AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshAuthDto } from './dto/refresh-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ProfileDto } from './dto/profile.dto';

/** Duration in milliseconds for the refresh-token cookie (7 days). */
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** Shared cookie options for the refresh token. */
function refreshCookieOptions(isProd: boolean) {
  const sameSite: 'strict' | 'lax' = isProd ? 'strict' : 'lax';
  return {
    httpOnly: true,
    secure: isProd,
    // Use lax in dev to allow localhost:4200 -> 3000 cross-port cookie
    sameSite,
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

/**
 * Clear any stale refresh_token cookies that may have been set with a
 * different path (e.g. the old '/api/' path). Without this the browser
 * sends two cookies and the backend reads the stale one first.
 */
function clearLegacyCookies(res: Response, isProd: boolean) {
  const base = { httpOnly: true, secure: isProd, sameSite: isProd ? 'strict' as const : 'lax' as const };
  // Previous path values that may still be stored in the browser
  res.clearCookie('refresh_token', { ...base, path: '/api/' });
  res.clearCookie('refresh_token', { ...base, path: '/api' });
}

/** Helper to attach the refresh-token cookie and return only the access token. */
function sendWithCookie(res: Response, result: AuthResult, isProd: boolean) {
  clearLegacyCookies(res, isProd);
  res.cookie('refresh_token', result.tokens.refreshToken, refreshCookieOptions(isProd));
  return res.json({
    user: result.user,
    tokens: { accessToken: result.tokens.accessToken },
  });
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() dto: RegisterAuthDto,
    @Res() res: Response,
  ): Promise<any> {
    const result = await this.authService.register(dto);
    const isProd = process.env.NODE_ENV === 'production';
    return sendWithCookie(res, result, isProd);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Authenticate user and get tokens' })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: { type: 'integer', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginAuthDto,
    @Res() res: Response,
  ): Promise<any> {
    const result = await this.authService.login(dto);
    const isProd = process.env.NODE_ENV === 'production';
    return sendWithCookie(res, result, isProd);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: { type: 'integer', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() dto: RefreshAuthDto,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<any> {
    // Prefer HttpOnly cookie, fall back to body for backward compatibility
    const token = req.cookies?.refresh_token || dto.refreshToken;
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const result = await this.authService.refresh(token);
    const isProd = process.env.NODE_ENV === 'production';
    return sendWithCookie(res, result, isProd);
  }

  @Post('revoke')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Token revoked successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async revoke(
    @Body() dto: RefreshAuthDto,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<any> {
    const token = req.cookies?.refresh_token || dto.refreshToken;
    await this.authService.revoke(token);
    // Clear the cookie (both current and legacy paths)
    const isProd = process.env.NODE_ENV === 'production';
    clearLegacyCookies(res, isProd);
    res.clearCookie('refresh_token', refreshCookieOptions(isProd));
    return res.json({ message: 'Token revoked' });
  }

  @Get('profile')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: ProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(
    @Request() req: { user: { id: number } },
  ): Promise<ProfileDto> {
    const userPayload: any = req.user || {};
    const userId = userPayload.id ?? userPayload.sub;
    
    // Always fetch from DB to ensure fresh subscription status (isPro)
    return this.authService.getProfile(userId);
  }

  // ─── Forgot / Reset Password ─────────────────────────────────

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Password changed.' })
  @ApiResponse({ status: 400, description: 'Current password incorrect or new password invalid.' })
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user?.id ?? req.user?.sub;
    await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
    return { message: 'Password changed successfully.' };
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'If the email exists, a reset link was sent.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto);
    // Always return the same message to prevent email enumeration
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using the emailed token' })
  @ApiResponse({ status: 200, description: 'Password has been reset successfully.' })
  @ApiResponse({ status: 400, description: 'Token invalid or expired.' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Password has been reset successfully. You can now log in.' };
  }
}
