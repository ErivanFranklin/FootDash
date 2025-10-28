import { Body, Controller, Post } from '@nestjs/common';
import { AuthResult, AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshAuthDto } from './dto/refresh-auth.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	register(@Body() dto: RegisterAuthDto): Promise<AuthResult> {
		return this.authService.register(dto);
	}

	@Post('login')
	login(@Body() dto: LoginAuthDto): Promise<AuthResult> {
		return this.authService.login(dto);
	}

	@Post('refresh')
	refresh(@Body() dto: RefreshAuthDto): Promise<AuthResult> {
		return this.authService.refresh(dto.refreshToken);
	}

	@Post('revoke')
	async revoke(@Body() dto: RefreshAuthDto): Promise<void> {
		await this.authService.revoke(dto.refreshToken);
	}
}
