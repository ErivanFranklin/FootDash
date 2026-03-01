import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Account email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;
}
