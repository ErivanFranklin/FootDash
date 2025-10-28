import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';

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
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user and persists to DB', async () => {
    const res = await service.register({ email: 'test@example.com', password: 'password123' });
    expect(res).toBeDefined();
    expect(res.user.email).toBe('test@example.com');
    expect(res.tokens.accessToken).toBeDefined();
  });
});
