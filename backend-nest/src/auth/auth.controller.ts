import { Body, Controller, Post } from '@nestjs/common';
import { AuthResult, AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

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
}
