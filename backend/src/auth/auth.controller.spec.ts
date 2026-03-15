import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'USER',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
    changePassword: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updatePreferences: jest.fn(),
    googleLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 'test@example.com', password: 'password', username: 'test' };
      mockAuthService.register.mockResolvedValue({ user: mockUser, tokens: {} });
      await controller.register(dto as any);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      mockAuthService.login.mockResolvedValue({ user: mockUser, tokens: {} });
      await controller.login(dto as any);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens', async () => {
      const dto = { refreshToken: 'token' };
      mockAuthService.refreshTokens.mockResolvedValue({ tokens: {} });
      await controller.refresh(dto);
      expect(service.refreshTokens).toHaveBeenCalledWith(dto.refreshToken);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const req = { user: { sub: 1 } };
      await controller.logout(req as any);
      expect(service.logout).toHaveBeenCalledWith(1);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const dto = { email: 'test@example.com' };
      await controller.forgotPassword(dto);
      expect(service.forgotPassword).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const dto = { token: 'token', password: 'new' };
      await controller.resetPassword(dto);
      expect(service.resetPassword).toHaveBeenCalledWith(dto.token, dto.password);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail', async () => {
      const dto = { token: 'token' };
      await controller.verifyEmail(dto);
      expect(service.verifyEmail).toHaveBeenCalledWith(dto.token);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile', async () => {
      const req = { user: { sub: 1 } };
      mockAuthService.getProfile.mockResolvedValue(mockUser);
      await controller.getProfile(req as any);
      expect(service.getProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should call authService.updateProfile', async () => {
      const req = { user: { sub: 1 } };
      const dto = { username: 'new' };
      await controller.updateProfile(req as any, dto as any);
      expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('googleAuthRedirect', () => {
    it('should call authService.googleLogin and redirect', async () => {
      const req = { user: { email: 'g@test.com' } };
      const res = { redirect: jest.fn() } as any;
      mockAuthService.googleLogin.mockResolvedValue({ tokens: { accessToken: 'at' } });
      
      await controller.googleAuthRedirect(req as any, res);
      
      expect(service.googleLogin).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('accessToken=at'));
    });
  });
});
