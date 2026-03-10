import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginAudit } from './entities/login-audit.entity';
import { MailService } from '../mail/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/user.entity';

describe('AuthService (TypeORM integration)', () => {
  let service: AuthService;

  const usersRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const refreshRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
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
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user and persists to DB', async () => {
    usersRepo.findOneBy.mockResolvedValue(null);
    usersRepo.create.mockImplementation((payload: Partial<User>) => payload);
    usersRepo.save.mockImplementation(async (payload: Partial<User>) => ({
      id: 1,
      email: payload.email,
      role: payload.role ?? UserRole.USER,
      password_hash: payload.password_hash,
    }));
    refreshRepo.create.mockImplementation(
      (payload: Partial<RefreshToken>) => payload,
    );
    refreshRepo.save.mockImplementation(async (token: RefreshToken) => token);

    const res = await service.register({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res).toBeDefined();
    expect(res.user.email).toBe('test@example.com');
    expect(res.user.role).toBe(UserRole.USER);
    expect(res.tokens.accessToken).toBeDefined();
  });
});
