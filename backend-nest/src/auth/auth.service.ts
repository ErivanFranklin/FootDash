import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

interface StoredUser {
	id: number;
	email: string;
	passwordHash: string;
}

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
	private readonly users: StoredUser[] = [];
	private idCounter = 1;

	constructor(private readonly jwtService: JwtService) {}

	async register(dto: RegisterAuthDto): Promise<AuthResult> {
		const email = dto.email.toLowerCase();
		const existing = this.users.find((user) => user.email === email);
		if (existing) {
			throw new ConflictException('Email already registered');
		}

		const passwordHash = await bcrypt.hash(dto.password, 10);
		const user = { id: this.idCounter++, email, passwordHash };
		this.users.push(user);

		const tokens = this.createTokens({ id: user.id, email: user.email });
			return { user: { id: user.id, email: user.email }, tokens };
	}

		async login(dto: LoginAuthDto): Promise<AuthResult> {
		const email = dto.email.toLowerCase();
		const user = this.users.find((entry) => entry.email === email);
		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
		if (!passwordMatches) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const tokens = this.createTokens({ id: user.id, email: user.email });
			return { user: { id: user.id, email: user.email }, tokens };
	}

	private createTokens(user: AuthUser): AuthTokens {
			const accessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
			const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });
		return { accessToken, refreshToken };
	}
}
