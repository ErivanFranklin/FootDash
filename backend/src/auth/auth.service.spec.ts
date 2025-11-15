import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './refresh-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    // add mock refresh repo
    (usersRepo as any).refreshRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

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
          useValue: (usersRepo as any).refreshRepo,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a new user and returns tokens', async () => {
    (usersRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
    const savedUser = { id: 1, email: 'a@b.com', passwordHash: 'x' } as any;
    (usersRepo.create as jest.Mock).mockReturnValue(savedUser);
    (usersRepo.save as jest.Mock).mockResolvedValue(savedUser);

    const res = await service.register({
      email: 'a@b.com',
      password: 'secret',
    } as any);
    expect(res.user.id).toBe(1);
    expect(res.user.email).toBe('a@b.com');
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
    } as any);
    const refreshRepo = (usersRepo as any).refreshRepo as any;
    (refreshRepo.findOne as jest.Mock).mockResolvedValue({
      token: 'valid-token',
      revoked: false,
      user: { id: 5, email: 'test@example.com' },
    });

    const res = await service.refresh('valid-token');
    expect(res.user.id).toBe(5);
    expect(res.user.email).toBe('test@example.com');
    expect(res.tokens.accessToken).toBeDefined();
    expect(res.tokens.refreshToken).toBeDefined();
  });

  it('revokes a refresh token', async () => {
    const refreshRepo = (usersRepo as any).refreshRepo as any;
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
});
