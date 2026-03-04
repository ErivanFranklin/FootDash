import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/user.entity';

describe('AuthService (TypeORM integration)', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, RefreshToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, RefreshToken]),
        JwtModule.register({ secret: 'test-secret' }),
      ],
      providers: [
        AuthService,
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
