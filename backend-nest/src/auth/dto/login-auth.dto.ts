import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 's3cr3t123'
  })
  @IsString()
  password!: string;
}
